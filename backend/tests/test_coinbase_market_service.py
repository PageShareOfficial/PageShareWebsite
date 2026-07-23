"""Unit tests for Coinbase market client (mocked HTTP)."""

from datetime import datetime, timezone
from unittest.mock import MagicMock
import httpx
import pytest
from app.services.coinbase_assets import normalize_base_asset, require_base_asset
from app.services.coinbase_market_service import (
    MAX_CANDLES_PER_REQUEST,
    CoinbaseUnavailableError,
    UnsupportedAssetError,
    get_candles,
    get_live_price,
)

def test_normalize_base_asset_is_open():
    assert normalize_base_asset(" btc ") == "BTC"
    assert require_base_asset("eth") == "ETH"
    assert require_base_asset("ANYNEWCOIN") == "ANYNEWCOIN"
    with pytest.raises(ValueError, match="required"):
        require_base_asset("  ")
    with pytest.raises(ValueError, match="Invalid asset"):
        require_base_asset("BTC-USD")

def _mock_response(status_code: int, payload) -> MagicMock:
    response = MagicMock(spec=httpx.Response)
    response.status_code = status_code
    response.json.return_value = payload
    response.text = str(payload)
    return response

def test_get_live_price_success():
    client = MagicMock(spec=httpx.Client)
    client.get.return_value = _mock_response(200, {"price": "65000.5"})

    price = get_live_price("btc", client=client)

    assert price == 65000.5
    assert "products/BTC-USD/ticker" in client.get.call_args.args[0]

def test_get_live_price_rejects_blank_asset():
    with pytest.raises(UnsupportedAssetError, match="required"):
        get_live_price("  ", client=MagicMock(spec=httpx.Client))

def test_get_live_price_retries_then_succeeds():
    client = MagicMock(spec=httpx.Client)
    client.get.side_effect = [
        _mock_response(503, {"message": "down"}),
        _mock_response(200, {"price": "100.25"}),
    ]

    assert get_live_price("ETH", client=client) == 100.25
    assert client.get.call_count == 2

def test_get_live_price_invalid_payload():
    client = MagicMock(spec=httpx.Client)
    client.get.return_value = _mock_response(200, {"price": "0"})

    with pytest.raises(CoinbaseUnavailableError, match="Invalid price"):
        get_live_price("SOL", client=client)

def test_get_candles_parses_coinbase_rows():
    client = MagicMock(spec=httpx.Client)
    # Coinbase: [time, low, high, open, close, volume] in seconds
    open_s = 1_700_000_000
    client.get.return_value = _mock_response(
        200,
        [[open_s, 9, 12, 10, 11, 100]],
    )
    start = datetime.fromtimestamp(open_s, tz=timezone.utc)
    end = datetime.fromtimestamp(open_s + 60, tz=timezone.utc)

    candles = get_candles("BTC", "1m", start, end, client=client)

    assert len(candles) == 1
    assert candles[0].open == 10.0
    assert candles[0].high == 12.0
    assert candles[0].low == 9.0
    assert candles[0].close == 11.0
    assert candles[0].open_time == start
    params = client.get.call_args.kwargs["params"]
    assert params["granularity"] == 60
    assert "products/BTC-USD/candles" in client.get.call_args.args[0]

def test_get_candles_rejects_bad_interval():
    with pytest.raises(ValueError, match="interval"):
        get_candles(
            "BTC",
            "30m",  # type: ignore[arg-type]
            datetime.now(timezone.utc),
            datetime.now(timezone.utc),
            client=MagicMock(spec=httpx.Client),
        )

def test_get_candles_http_error():
    client = MagicMock(spec=httpx.Client)
    client.get.return_value = _mock_response(404, {"message": "NotFound"})

    with pytest.raises(CoinbaseUnavailableError, match="NotFound"):
        get_candles(
            "MON",
            "6h",
            datetime(2024, 1, 1, tzinfo=timezone.utc),
            datetime(2024, 1, 2, tzinfo=timezone.utc),
            client=client,
        )

def test_get_candles_chunks_to_stay_under_300():
    """Wide windows must be split so each request stays within Coinbase's 300 cap."""
    client = MagicMock(spec=httpx.Client)
    client.get.return_value = _mock_response(200, [])
    start = datetime(2024, 1, 1, tzinfo=timezone.utc)
    # 400 minutes of 1m candles → needs at least 2 chunks of ≤300
    end = datetime(2024, 1, 1, 6, 40, tzinfo=timezone.utc)

    get_candles("BTC", "1m", start, end, client=client)

    assert client.get.call_count >= 2
    assert MAX_CANDLES_PER_REQUEST == 300
