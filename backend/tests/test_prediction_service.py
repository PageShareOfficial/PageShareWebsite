"""Tests for prediction submission quota and Coinbase entry."""

from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, patch
from uuid import uuid4
import pytest
from app.models.user import User
from app.services.prediction_service import (
    MarketPriceError,
    count_predictions_submitted_today,
    create_prediction,
    fetch_live_price_for_asset,
)

def test_count_predictions_submitted_today_uses_local_day_bounds():
    user_id = uuid4()
    user = MagicMock()
    user.timezone = "UTC"
    db = MagicMock()
    db.get.return_value = user
    query = db.query.return_value
    filtered = query.filter.return_value
    filtered.scalar.return_value = 1

    count = count_predictions_submitted_today(
        db, user_id, client_timezone="Asia/Kolkata"
    )

    assert count == 1
    db.get.assert_called_once_with(User, user_id)
    query.filter.assert_called_once()
    filter_args = query.filter.call_args[0]
    start_utc = filter_args[1].right.value
    end_utc = filter_args[2].right.value
    assert start_utc.tzinfo == timezone.utc
    assert end_utc.tzinfo == timezone.utc
    assert end_utc > start_utc

def test_fetch_live_price_for_asset_normalizes_symbol():
    with patch(
        "app.services.prediction_service.get_live_price",
        return_value=65000.5,
    ):
        asset, price = fetch_live_price_for_asset(" btc ")
    assert asset == "BTC"
    assert price == 65000.5

def test_create_prediction_overwrites_client_entry_with_coinbase():
    user_id = uuid4()
    db = MagicMock()
    now = datetime.now(timezone.utc)
    prediction = MagicMock()
    db.refresh.side_effect = lambda row: None

    with (
        patch(
            "app.services.prediction_service.is_analyst_user",
            return_value=True,
        ),
        patch(
            "app.services.prediction_service.count_predictions_submitted_today",
            return_value=0,
        ),
        patch(
            "app.services.prediction_service.get_live_price",
            return_value=42000.0,
        ) as mock_price,
        patch(
            "app.services.prediction_service.validate_submission_payload"
        ) as mock_validate,
        patch(
            "app.services.prediction_service.Prediction",
            return_value=prediction,
        ),
        patch(
            "app.services.prediction_service.stamp_anchor_fields",
        ),
        patch(
            "app.services.prediction_service.is_polygon_configured",
            return_value=False,
        ),
    ):
        result = create_prediction(
            db,
            user_id=user_id,
            asset="BTC",
            asset_name="Bitcoin",
            position="long",
            entry_price=1.0,
            target_price=45000.0,
            stop_loss=40000.0,
            lock_started_at=now,
            expiry_at=now + timedelta(hours=2),
            confidence=0.75,
            thesis="Breakout setup",
        )

    mock_price.assert_called_once_with("BTC")
    mock_validate.assert_called_once()
    assert mock_validate.call_args.kwargs["entry_price"] == 42000.0
    assert result is prediction
    db.add.assert_called_once_with(prediction)
    db.commit.assert_called_once()

def test_fetch_live_price_wraps_coinbase_errors():
    from app.services.coinbase_market_service import CoinbaseUnavailableError

    with patch(
        "app.services.prediction_service.get_live_price",
        side_effect=CoinbaseUnavailableError("down"),
    ):
        with pytest.raises(MarketPriceError, match="down"):
            fetch_live_price_for_asset("ETH")
