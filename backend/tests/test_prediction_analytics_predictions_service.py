"""Tests for analytics predictions index and lazy detail settle."""

from datetime import datetime, timezone
from unittest.mock import MagicMock, patch
from uuid import uuid4
from app.services.prediction_analytics_predictions_service import (
    get_analyst_prediction_detail_for_investor,
    get_prediction_for_index,
    list_prediction_index,
)

def test_list_prediction_index_numbers_oldest_as_one_newest_first():
    db = MagicMock()
    oldest_id = uuid4()
    newest_id = uuid4()
    now = datetime.now(timezone.utc)

    oldest = MagicMock(
        id=oldest_id,
        asset="BTC",
        status="completed",
        outcome="win",
        created_at=now,
    )
    newest = MagicMock(
        id=newest_id,
        asset="ETH",
        status="active",
        outcome=None,
        created_at=now,
    )

    query = MagicMock()
    query.filter.return_value = query
    query.order_by.return_value = query
    query.all.return_value = [oldest, newest]
    db.query.return_value = query

    items = list_prediction_index(db, uuid4())

    assert len(items) == 2
    assert items[0].id == newest_id
    assert items[0].number == 2
    assert items[1].id == oldest_id
    assert items[1].number == 1

def test_get_prediction_for_index_settles_when_due():
    db = MagicMock()
    analyst_id = uuid4()
    prediction_id = uuid4()
    prediction = MagicMock(id=prediction_id)

    with patch(
        "app.services.prediction_analytics_predictions_service._indexed_predictions",
        return_value=[prediction],
    ), patch(
        "app.services.prediction_analytics_predictions_service.settle_prediction_if_due",
        return_value=True,
    ) as mock_settle:
        number, row = get_prediction_for_index(
            db, analyst_id, prediction_id, settle_if_due=True
        )

    assert number == 1
    assert row is prediction
    mock_settle.assert_called_once_with(db, prediction)
    db.refresh.assert_called_once_with(prediction)

def test_investor_prediction_detail_does_not_settle():
    db = MagicMock()
    investor_id = uuid4()
    analyst_id = uuid4()
    prediction_id = uuid4()
    analyst = MagicMock(id=analyst_id, username="alice")
    prediction = MagicMock(id=prediction_id)

    with patch(
        "app.services.prediction_analytics_predictions_service.assert_investor_user",
    ), patch(
        "app.services.prediction_analytics_predictions_service.get_user_by_username",
        return_value=analyst,
    ), patch(
        "app.services.prediction_analytics_predictions_service.assert_analyst_target",
    ), patch(
        "app.services.prediction_analytics_predictions_service.get_prediction_for_index",
        return_value=(3, prediction),
    ) as mock_get:
        _, number, row = get_analyst_prediction_detail_for_investor(
            db, investor_id, "alice", prediction_id
        )

    assert number == 3
    assert row is prediction
    mock_get.assert_called_once_with(
        db, analyst_id, prediction_id, settle_if_due=False
    )
