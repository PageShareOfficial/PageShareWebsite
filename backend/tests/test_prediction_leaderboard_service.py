"""Tests for prediction leaderboard ranking and identity redaction."""

from datetime import datetime, timezone
from unittest.mock import MagicMock, patch
from uuid import uuid4
import pytest
from app.services.billing_constants import PLAN_ID_ANALYST, PLAN_ID_INVESTOR
from app.services.prediction_leaderboard_service import (
    LeaderboardEntryRow,
    build_leaderboard_entry_response,
    leaderboard_avatar_initials,
    list_prediction_leaderboard,
    masked_leaderboard_display_name,
    should_reveal_leaderboard_identity,
)


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

def test_masked_leaderboard_display_name():
    assert masked_leaderboard_display_name(1) == "Analyst_1"
    assert masked_leaderboard_display_name(12) == "Analyst_12"
    assert masked_leaderboard_display_name(0) == "Analyst"

def test_leaderboard_avatar_initials_from_display_name():
    assert leaderboard_avatar_initials("Maya Chen") == "MC"
    assert leaderboard_avatar_initials("Alex") == "A"
    assert leaderboard_avatar_initials("  ") == "?"
    assert leaderboard_avatar_initials(None) == "?"
    assert leaderboard_avatar_initials("") == "?"

def test_should_reveal_identity_for_investor_and_own_row():
    entry_id = uuid4()
    viewer_id = uuid4()

    assert should_reveal_leaderboard_identity(
        viewer_plan_id=PLAN_ID_INVESTOR,
        viewer_user_id=viewer_id,
        entry_user_id=entry_id,
    )
    assert should_reveal_leaderboard_identity(
        viewer_plan_id=PLAN_ID_ANALYST,
        viewer_user_id=entry_id,
        entry_user_id=entry_id,
    )
    assert not should_reveal_leaderboard_identity(
        viewer_plan_id=PLAN_ID_ANALYST,
        viewer_user_id=viewer_id,
        entry_user_id=entry_id,
    )
    assert not should_reveal_leaderboard_identity(
        viewer_plan_id=None,
        viewer_user_id=None,
        entry_user_id=entry_id,
    )

def test_build_leaderboard_entry_redacts_for_free_viewer():
    entry_id = uuid4()
    row = LeaderboardEntryRow(
        user_id=entry_id,
        rank=2,
        net_rr_30d=1.25,
        win_rate_percent=50.0,
        predictions_count=4,
        wins=2,
    )
    user = MagicMock()
    user.username = "realhandle"
    user.display_name = "Real Name"
    user.profile_picture_url = "https://cdn.example/a.png"

    masked = build_leaderboard_entry_response(
        row=row,
        user=user,
        subscription_plan_id=PLAN_ID_ANALYST,
        viewer_plan_id=None,
        viewer_user_id=None,
    )
    assert masked.username == "analyst_2"
    assert masked.display_name == "Analyst_2"
    assert masked.profile_picture_url is None
    assert masked.avatar_initials == "RN"
    assert masked.subscription_plan_id == PLAN_ID_ANALYST
    assert masked.predictions_count == 4

    revealed = build_leaderboard_entry_response(
        row=row,
        user=user,
        subscription_plan_id=PLAN_ID_ANALYST,
        viewer_plan_id=PLAN_ID_INVESTOR,
        viewer_user_id=uuid4(),
    )
    assert revealed.username == "realhandle"
    assert revealed.display_name == "Real Name"
    assert revealed.profile_picture_url == "https://cdn.example/a.png"
    assert revealed.avatar_initials is None

def test_build_leaderboard_entry_keeps_own_row_for_analyst():
    entry_id = uuid4()
    row = LeaderboardEntryRow(
        user_id=entry_id,
        rank=1,
        net_rr_30d=3.0,
        win_rate_percent=70.0,
        predictions_count=10,
        wins=7,
    )
    user = MagicMock()
    user.username = "me"
    user.display_name = "Me"
    user.profile_picture_url = "https://cdn.example/me.png"

    own = build_leaderboard_entry_response(
        row=row,
        user=user,
        subscription_plan_id=PLAN_ID_ANALYST,
        viewer_plan_id=PLAN_ID_ANALYST,
        viewer_user_id=entry_id,
    )
    assert own.username == "me"
    assert own.display_name == "Me"
    assert own.profile_picture_url == "https://cdn.example/me.png"
