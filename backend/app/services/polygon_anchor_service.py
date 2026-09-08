"""Platform-paid Polygon relayer: emit PredictionAnchored for a prediction hash."""

from __future__ import annotations
import logging
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Protocol
from uuid import UUID
from sqlalchemy.orm import Session
from app.config import Settings, get_settings
from app.database import db_session
from app.models.prediction import Prediction
from app.services.prediction_constants import (
    ANCHOR_RETRY_BATCH_LIMIT,
    ANCHOR_RETRY_STATUSES,
    ANCHOR_STATUS_CONFIRMED,
    ANCHOR_STATUS_FAILED,
    ANCHOR_STATUS_NONE,
    ANCHOR_STATUS_PENDING,
    ANCHOR_STATUS_SUBMITTED,
)
from app.services.prediction_hash_service import (
    CONFIDENCE_DECIMAL_PLACES,
    PRICE_DECIMAL_PLACES,
    compute_prediction_content_hash,
    format_fixed_decimal,
)

logger = logging.getLogger("pageshare.polygon_anchor")

BYTES32_LENGTH = 32
ANCHOR_GAS_LIMIT = 300_000
RECEIPT_TIMEOUT_SECONDS = 120
RPC_REQUEST_TIMEOUT_SECONDS = 30
SUGGESTED_POLYGON_RPC_URL = "https://polygon.drpc.org"

EXPLORER_TX_URLS = {
    137: "https://polygonscan.com/tx/{tx}",
    80002: "https://amoy.polygonscan.com/tx/{tx}",
}

_PUBLIC_PREDICTION_COMPONENTS = [
    {"internalType": "string", "name": "asset", "type": "string"},
    {"internalType": "string", "name": "position", "type": "string"},
    {"internalType": "string", "name": "entryPrice", "type": "string"},
    {"internalType": "string", "name": "targetPrice", "type": "string"},
    {"internalType": "string", "name": "stopLoss", "type": "string"},
    {"internalType": "string", "name": "confidence", "type": "string"},
    {"internalType": "uint256", "name": "lockStartedAt", "type": "uint256"},
    {"internalType": "uint256", "name": "expiryAt", "type": "uint256"},
]
ANCHOR_ABI = [
    {
        "inputs": [
            {"internalType": "bytes32", "name": "predictionId", "type": "bytes32"},
            {
                "components": _PUBLIC_PREDICTION_COMPONENTS,
                "internalType": "struct PredictionAnchor.PublicPrediction",
                "name": "prediction",
                "type": "tuple",
            },
            {"internalType": "bytes32", "name": "contentHash", "type": "bytes32"},
        ],
        "name": "anchor",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    }
]

class AnchorablePrediction(Protocol):
    """Minimal prediction shape needed to build on-chain calldata."""

    id: Any
    asset: Any
    position: Any
    entry_price: Any
    target_price: Any
    stop_loss: Any
    confidence: Any
    lock_started_at: datetime
    expiry_at: datetime
    content_hash: str | None

@dataclass(frozen=True)
class RelayerConnection:
    """Connected web3 client, signed account, and PredictionAnchor contract."""

    w3: Any
    account: Any
    contract: Any

def is_polygon_configured(settings: Settings) -> bool:
    return bool(
        settings.polygon_rpc_url
        and settings.polygon_relayer_private_key
        and settings.polygon_anchor_contract_address
    )

def polygon_tx_explorer_url(chain_id: int | None, tx_hash: str | None) -> str | None:
    if chain_id is None or not tx_hash:
        return None
    template = EXPLORER_TX_URLS.get(int(chain_id))
    if template is None:
        return None
    return template.format(tx=tx_hash)

def stamp_anchor_fields(prediction: Prediction, *, chain_configured: bool) -> None:
    """Set content hash and initial anchor status on a flushed prediction row."""
    prediction.content_hash = compute_prediction_content_hash(prediction)
    prediction.anchor_status = (
        ANCHOR_STATUS_PENDING if chain_configured else ANCHOR_STATUS_NONE
    )

def uuid_to_bytes32(value: UUID) -> bytes:
    return value.bytes.rjust(BYTES32_LENGTH, b"\x00")

def hash_hex_to_bytes32(content_hash: str | None) -> bytes:
    if not content_hash or not str(content_hash).strip():
        raise ValueError("content hash is required")
    normalized = str(content_hash).strip().lower().removeprefix("0x")
    try:
        raw = bytes.fromhex(normalized)
    except ValueError as exc:
        raise ValueError("content hash must be valid hex") from exc
    if len(raw) != BYTES32_LENGTH:
        raise ValueError("content hash must be 32 bytes")
    return raw

def to_unix_seconds(value: datetime) -> int:
    """UTC unix seconds for on-chain timestamps."""
    if value.tzinfo is None:
        aware = value.replace(tzinfo=timezone.utc)
    else:
        aware = value.astimezone(timezone.utc)
    return int(aware.timestamp())


def public_anchor_args(prediction: AnchorablePrediction) -> tuple:
    """Calldata for PredictionAnchor.anchor (no user id, thesis, or media)."""
    if prediction.id is None:
        raise ValueError("prediction id is required")
    return (
        uuid_to_bytes32(UUID(str(prediction.id))),
        _public_prediction_tuple(prediction),
        hash_hex_to_bytes32(prediction.content_hash),
    )

def process_anchor_row(db: Session, settings: Settings, prediction: Prediction) -> bool:
    """Broadcast or confirm one prediction. RPC errors must not raise."""
    if prediction.anchor_status == ANCHOR_STATUS_CONFIRMED:
        return True
    if not prediction.content_hash:
        return False
    try:
        return _process_anchor_row_or_raise(db, settings, prediction)
    except ImportError:
        logger.exception("web3 is required for Polygon anchoring")
        return False
    except Exception:
        logger.exception("Polygon anchor failed for prediction %s", prediction.id)
        _mark_after_anchor_exception(db, prediction)
        return False

def retry_pending_anchors(
    db: Session,
    settings: Settings,
    *,
    limit: int = ANCHOR_RETRY_BATCH_LIMIT,
) -> dict[str, int | bool | str]:
    if not is_polygon_configured(settings):
        return {"skipped": True, "reason": "not_configured"}
    if limit < 1:
        raise ValueError("limit must be >= 1")
    rows = _fetch_retry_rows(db, limit)
    confirmed = sum(1 for row in rows if process_anchor_row(db, settings, row))
    failed = len(rows) - confirmed
    return {
        "skipped": False,
        "attempted": len(rows),
        "confirmed": confirmed,
        "failed": failed,
    }

def run_anchor_in_background(prediction_id: UUID) -> None:
    settings = get_settings()
    if not is_polygon_configured(settings):
        return
    try:
        with db_session() as db:
            row = db.get(Prediction, prediction_id)
            if row is None:
                return
            process_anchor_row(db, settings, row)
    except Exception:
        logger.exception("Background Polygon anchor failed for %s", prediction_id)

def schedule_anchor(background_tasks: Any, prediction_id: UUID) -> None:
    if not is_polygon_configured(get_settings()):
        return
    background_tasks.add_task(run_anchor_in_background, prediction_id)

def _public_prediction_tuple(prediction: AnchorablePrediction) -> tuple:
    return (
        str(prediction.asset).strip().upper(),
        str(prediction.position).strip().lower(),
        format_fixed_decimal(prediction.entry_price, PRICE_DECIMAL_PLACES),
        format_fixed_decimal(prediction.target_price, PRICE_DECIMAL_PLACES),
        format_fixed_decimal(prediction.stop_loss, PRICE_DECIMAL_PLACES),
        format_fixed_decimal(prediction.confidence, CONFIDENCE_DECIMAL_PLACES),
        to_unix_seconds(prediction.lock_started_at),
        to_unix_seconds(prediction.expiry_at),
    )

def _process_anchor_row_or_raise(
    db: Session, settings: Settings, prediction: Prediction
) -> bool:
    # Prefer confirm whenever a hash exists (including failed-after-timeout rows)
    # so cron never rebroadcasts a tx that may already be on-chain.
    if prediction.chain_tx_hash:
        return _confirm_existing_transaction(db, settings, prediction)
    return _broadcast_and_confirm(db, settings, prediction)

def _fetch_retry_rows(db: Session, limit: int) -> list[Prediction]:
    return (
        db.query(Prediction)
        .filter(Prediction.anchor_status.in_(tuple(ANCHOR_RETRY_STATUSES)))
        .filter(Prediction.content_hash.isnot(None))
        .order_by(Prediction.created_at.asc())
        .limit(limit)
        .all()
    )

def _broadcast_and_confirm(
    db: Session, settings: Settings, prediction: Prediction
) -> bool:
    tx_hash, chain_id = _send_anchor_transaction(settings, prediction)
    prediction.chain_tx_hash = tx_hash
    prediction.chain_id = chain_id
    prediction.anchor_status = ANCHOR_STATUS_SUBMITTED
    db.commit()
    return _confirm_existing_transaction(db, settings, prediction)

def _confirm_existing_transaction(
    db: Session, settings: Settings, prediction: Prediction
) -> bool:
    if not prediction.chain_tx_hash:
        raise ValueError("submitted anchor is missing chain_tx_hash")
    receipt = _wait_for_receipt(settings, prediction.chain_tx_hash)
    if int(receipt.get("status", 0)) != 1:
        # Cleared so the next retry can broadcast a replacement tx.
        prediction.chain_tx_hash = None
        _mark_failed(db, prediction)
        return False
    prediction.anchor_status = ANCHOR_STATUS_CONFIRMED
    prediction.anchored_at = datetime.now(timezone.utc)
    if prediction.chain_id is None:
        prediction.chain_id = settings.polygon_chain_id
    db.commit()
    return True

def _mark_after_anchor_exception(db: Session, prediction: Prediction) -> None:
    """Keep submitted+hash on confirm timeouts; only mark failed when no tx was sent."""
    if prediction.chain_tx_hash:
        prediction.anchor_status = ANCHOR_STATUS_SUBMITTED
        db.commit()
        return
    _mark_failed(db, prediction)

def _mark_failed(db: Session, prediction: Prediction) -> None:
    prediction.anchor_status = ANCHOR_STATUS_FAILED
    db.commit()

def _send_anchor_transaction(
    settings: Settings, prediction: Prediction
) -> tuple[str, int]:
    relayer = _connect_relayer(settings)
    unsigned = _build_anchor_transaction(relayer, settings, prediction)
    signed = relayer.w3.eth.account.sign_transaction(
        unsigned, settings.polygon_relayer_private_key
    )
    raw_transaction = _raw_signed_transaction(signed)
    tx_hash = relayer.w3.eth.send_raw_transaction(raw_transaction)
    return tx_hash.hex(), settings.polygon_chain_id

def _build_anchor_transaction(
    relayer: RelayerConnection,
    settings: Settings,
    prediction: Prediction,
) -> dict[str, Any]:
    return relayer.contract.functions.anchor(
        *public_anchor_args(prediction)
    ).build_transaction(
        {
            "from": relayer.account.address,
            "nonce": relayer.w3.eth.get_transaction_count(relayer.account.address),
            "chainId": settings.polygon_chain_id,
            "gas": ANCHOR_GAS_LIMIT,
        }
    )

def _raw_signed_transaction(signed: Any) -> bytes:
    raw = getattr(signed, "rawTransaction", None) or getattr(
        signed, "raw_transaction", None
    )
    if raw is None:
        raise RuntimeError("signed transaction is missing raw bytes")
    return raw

def _wait_for_receipt(settings: Settings, tx_hash: str) -> dict[str, Any]:
    relayer = _connect_relayer(settings)
    return relayer.w3.eth.wait_for_transaction_receipt(
        tx_hash, timeout=RECEIPT_TIMEOUT_SECONDS
    )

def _connect_relayer(settings: Settings) -> RelayerConnection:
    from web3 import Web3
    from web3.middleware import ExtraDataToPOAMiddleware

    if not is_polygon_configured(settings):
        raise RuntimeError("Polygon anchoring is not configured")
    w3 = Web3(
        Web3.HTTPProvider(
            settings.polygon_rpc_url,
            request_kwargs={"timeout": RPC_REQUEST_TIMEOUT_SECONDS},
        )
    )
    # Polygon (and Amoy) use longer block.extraData than vanilla Ethereum.
    w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
    _assert_rpc_chain(w3, settings.polygon_chain_id)
    account = w3.eth.account.from_key(settings.polygon_relayer_private_key)
    contract = w3.eth.contract(
        address=Web3.to_checksum_address(settings.polygon_anchor_contract_address),
        abi=ANCHOR_ABI,
    )
    return RelayerConnection(w3=w3, account=account, contract=contract)

def _assert_rpc_chain(w3: Any, expected_chain_id: int) -> None:
    from requests.exceptions import HTTPError

    try:
        chain_id = w3.eth.chain_id
    except HTTPError as exc:
        raise RuntimeError(_rpc_http_error_message(w3, exc)) from exc
    if chain_id != expected_chain_id:
        raise RuntimeError(
            f"Polygon RPC chain_id {chain_id} does not match "
            f"POLYGON_CHAIN_ID {expected_chain_id}"
        )

def _rpc_http_error_message(w3: Any, exc: Exception) -> str:
    status = getattr(getattr(exc, "response", None), "status_code", None)
    endpoint = getattr(w3.provider, "endpoint_uri", "unknown")
    return (
        f"Polygon RPC HTTP {status} at {endpoint}. "
        f"Set POLYGON_RPC_URL to {SUGGESTED_POLYGON_RPC_URL} "
        "or another working Polygon JSON-RPC endpoint."
    )
