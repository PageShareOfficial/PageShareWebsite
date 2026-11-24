"""Network stats for the right rail."""

from unittest.mock import MagicMock
from app.services.network_stats_service import get_network_stats

def test_get_network_stats_maps_query_results():
    db = MagicMock()
    prediction_total = MagicMock()
    prediction_total.scalar.return_value = 10
    verified_predictions = MagicMock()
    verified_predictions.filter.return_value = verified_predictions
    verified_predictions.scalar.return_value = 6
    publishing_analysts = MagicMock()
    publishing_analysts.scalar.return_value = 3
    saved_analysts = MagicMock()
    saved_analysts.scalar.return_value = 7
    saving_investors = MagicMock()
    saving_investors.scalar.return_value = 2

    db.query.side_effect = [
        prediction_total,
        verified_predictions,
        publishing_analysts,
        saved_analysts,
        saving_investors,
    ]

    assert get_network_stats(db) == {
        "total_predictions": 10,
        "verified_predictions": 6,
        "publishing_analysts": 3,
        "saved_analysts": 7,
        "saving_investors": 2,
    }

def test_get_network_stats_treats_none_as_zero():
    db = MagicMock()
    empty = MagicMock()
    empty.filter.return_value = empty
    empty.scalar.return_value = None

    db.query.side_effect = [empty, empty, empty, empty, empty]

    assert get_network_stats(db) == {
        "total_predictions": 0,
        "verified_predictions": 0,
        "publishing_analysts": 0,
        "saved_analysts": 0,
        "saving_investors": 0,
    }
    