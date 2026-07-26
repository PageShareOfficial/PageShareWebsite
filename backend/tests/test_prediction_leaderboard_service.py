"""Tests for prediction leaderboard ranking."""

from datetime import datetime, timezone
from unittest.mock import MagicMock, patch
from uuid import uuid4
import pytest
from app.services.prediction_leaderboard_service import list_prediction_leaderboard

def test_list_leaderboard_empty_when_no_analysts():
    db = MagicMock()
    with patch(
        "app.services.prediction_leaderboard_service._analyst_user_ids",
        return_value=set(),
    ):
        rows, total = list_prediction_leaderboard(db)
    assert rows == []
    assert total == 0

def test_list_leaderboard_ranks_by_net_rr_and_paginates():
    db = MagicMock()
    analyst_a = uuid4()
    analyst_b = uuid4()
    analyst_c = uuid4()
    now = datetime(2026, 7, 1, tzinfo=timezone.utc)

    with patch(
        "app.services.prediction_leaderboard_service._analyst_user_ids",
        return_value={analyst_a, analyst_b, analyst_c},
    ), patch(
        "app.services.prediction_leaderboard_service._lifetime_stats_by_analyst",
        return_value={
            analyst_a: (10, 6, 2),
            analyst_b: (5, 2, 1),
            analyst_c: (3, 1, 1),
        },
    ), patch(
        "app.services.prediction_leaderboard_service._net_rr_30d_by_analyst",
        return_value={analyst_a: 1.5, analyst_b: 3.2, analyst_c: 2.0},
    ):
        page_one, total = list_prediction_leaderboard(
            db, page=1, per_page=1, now=now
        )
        page_two, _ = list_prediction_leaderboard(
            db, page=2, per_page=1, now=now
        )

    assert total == 3
    assert len(page_one) == 1
    assert page_one[0].user_id == analyst_b
    assert page_one[0].rank == 1
    assert page_one[0].net_rr_30d == 3.2
    assert page_one[0].win_rate_percent == pytest.approx(66.7)

    assert len(page_two) == 1
    assert page_two[0].user_id == analyst_c
    assert page_two[0].rank == 2
