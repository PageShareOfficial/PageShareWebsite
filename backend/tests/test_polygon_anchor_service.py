"""Tests for Polygon anchor helpers that do not require RPC."""

from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import MagicMock, patch
from uuid import UUID
import pytest
from requests.exceptions import HTTPError
from app.services.polygon_anchor_service import (
    _assert_rpc_chain,
    _mark_after_anchor_exception,
    _process_anchor_row_or_raise,
    hash_hex_to_bytes32,
    is_polygon_configured,
    polygon_tx_explorer_url,
    process_anchor_row,
    public_anchor_args,
    retry_pending_anchors,
    stamp_anchor_fields,
    to_unix_seconds,
    uuid_to_bytes32,
)
from app.services.prediction_constants import (
    ANCHOR_STATUS_FAILED,
    ANCHOR_STATUS_NONE,
    ANCHOR_STATUS_PENDING,
    ANCHOR_STATUS_SUBMITTED,
)

LOCKED_AT = datetime(2026, 8, 18, 12, 0, tzinfo=timezone.utc)

def _row() -> SimpleNamespace:
    return SimpleNamespace(
        id=UUID("11111111-1111-1111-1111-111111111111"),
        user_id=UUID("22222222-2222-2222-2222-222222222222"),
        asset="ETH",
        position="short",
        entry_price=3000,
        target_price=2800,
        stop_loss=3100,
        start_time=LOCKED_AT,
        lock_started_at=LOCKED_AT,
        expiry_at=datetime(2026, 8, 18, 13, 0, tzinfo=timezone.utc),
        confidence=0.6,
        content_hash=None,
        anchor_status=None,
    )

def test_assert_rpc_chain_rejects_http_401():
    class EthStub:
        @property
        def chain_id(self):
            raise HTTPError(response=SimpleNamespace(status_code=401))

    w3 = SimpleNamespace(
        eth=EthStub(),
        provider=SimpleNamespace(endpoint_uri="https://polygon-rpc.com"),
    )
    with pytest.raises(RuntimeError, match="401") as caught:
        _assert_rpc_chain(w3, 137)
    assert "polygon.drpc.org" in str(caught.value)

def test_assert_rpc_chain_rejects_wrong_network():
    w3 = SimpleNamespace(eth=SimpleNamespace(chain_id=1), provider=None)
    with pytest.raises(RuntimeError, match="chain_id 1"):
        _assert_rpc_chain(w3, 137)

def test_is_polygon_configured_requires_rpc_key_and_contract():
    settings = SimpleNamespace(
        polygon_rpc_url="https://polygon.drpc.org",
        polygon_relayer_private_key="0xabc",
        polygon_anchor_contract_address="0xcontract",
    )
    assert is_polygon_configured(settings) is True
    settings.polygon_relayer_private_key = ""
    assert is_polygon_configured(settings) is False

def test_explorer_url_for_polygon_mainnet():
    assert polygon_tx_explorer_url(137, "0xdead") == (
        "https://polygonscan.com/tx/0xdead"
    )
    assert polygon_tx_explorer_url(1, "0xdead") is None

def test_stamp_anchor_fields_pending_when_chain_configured():
    row = _row()
    stamp_anchor_fields(row, chain_configured=True)
    assert row.anchor_status == ANCHOR_STATUS_PENDING
    assert row.content_hash and len(row.content_hash) == 64
    stamp_anchor_fields(row, chain_configured=False)
    assert row.anchor_status == ANCHOR_STATUS_NONE

def test_retry_pending_anchors_skips_when_not_configured():
    settings = SimpleNamespace(
        polygon_rpc_url="",
        polygon_relayer_private_key="",
        polygon_anchor_contract_address="",
    )
    result = retry_pending_anchors(MagicMock(), settings)
    assert result["skipped"] is True
    assert result["reason"] == "not_configured"

def test_retry_pending_anchors_rejects_non_positive_limit():
    settings = SimpleNamespace(
        polygon_rpc_url="https://polygon.drpc.org",
        polygon_relayer_private_key="0xabc",
        polygon_anchor_contract_address="0xcontract",
    )
    with pytest.raises(ValueError, match="limit"):
        retry_pending_anchors(MagicMock(), settings, limit=0)

def test_uuid_to_bytes32_left_pads_16_byte_uuid():
    value = UUID("11111111-1111-1111-1111-111111111111")
    packed = uuid_to_bytes32(value)
    assert len(packed) == 32
    assert packed.endswith(value.bytes)
    assert packed.startswith(b"\x00" * 16)

def test_hash_hex_to_bytes32_rejects_empty_and_bad_length():
    with pytest.raises(ValueError, match="required"):
        hash_hex_to_bytes32("")
    with pytest.raises(ValueError, match="32 bytes"):
        hash_hex_to_bytes32("abcd")

def test_public_anchor_args_omit_user_and_thesis():
    row = _row()
    stamp_anchor_fields(row, chain_configured=True)
    prediction_id, public_fields, content_hash = public_anchor_args(row)
    assert len(prediction_id) == 32
    assert content_hash and len(content_hash) == 32
    assert public_fields[0] == "ETH"
    assert public_fields[1] == "short"
    assert public_fields[2] == "3000.00000000"
    assert public_fields[5] == "0.6000"
    assert public_fields[6] == to_unix_seconds(LOCKED_AT)
    assert public_fields[7] == to_unix_seconds(row.expiry_at)
    serialized = " ".join(str(item) for item in public_fields)
    assert "22222222" not in serialized
    assert "thesis" not in serialized.lower()

def test_failed_row_with_tx_hash_confirms_instead_of_rebroadcast():
    """Receipt timeout must not cause a second send on the next cron pass."""
    row = _row()
    row.content_hash = "ab" * 32
    row.anchor_status = ANCHOR_STATUS_FAILED
    row.chain_tx_hash = "0xabc123"
    db = MagicMock()
    settings = SimpleNamespace(polygon_chain_id=137)

    with (
        patch(
            "app.services.polygon_anchor_service._confirm_existing_transaction",
            return_value=True,
        ) as confirm,
        patch(
            "app.services.polygon_anchor_service._broadcast_and_confirm"
        ) as broadcast,
    ):
        assert _process_anchor_row_or_raise(db, settings, row) is True

    confirm.assert_called_once_with(db, settings, row)
    broadcast.assert_not_called()

def test_mark_after_exception_keeps_submitted_when_tx_hash_exists():
    row = _row()
    row.chain_tx_hash = "0xdeadbeef"
    row.anchor_status = ANCHOR_STATUS_SUBMITTED
    db = MagicMock()
    _mark_after_anchor_exception(db, row)
    assert row.anchor_status == ANCHOR_STATUS_SUBMITTED
    db.commit.assert_called_once()

def test_mark_after_exception_marks_failed_when_no_tx_hash():
    row = _row()
    row.chain_tx_hash = None
    row.anchor_status = ANCHOR_STATUS_PENDING
    db = MagicMock()
    _mark_after_anchor_exception(db, row)
    assert row.anchor_status == ANCHOR_STATUS_FAILED
    db.commit.assert_called_once()

def test_process_anchor_row_preserves_hash_after_confirm_timeout():
    row = _row()
    row.content_hash = "cd" * 32
    row.anchor_status = ANCHOR_STATUS_SUBMITTED
    row.chain_tx_hash = "0xpending"
    db = MagicMock()
    settings = SimpleNamespace()

    with patch(
        "app.services.polygon_anchor_service._process_anchor_row_or_raise",
        side_effect=TimeoutError("receipt wait timed out"),
    ):
        assert process_anchor_row(db, settings, row) is False

    assert row.chain_tx_hash == "0xpending"
    assert row.anchor_status == ANCHOR_STATUS_SUBMITTED
