"""Unit tests for prediction evaluate engine (outcome rules + helpers).

Smart-search against Coinbase is covered by live scripts under
`tests/` (real API); reports land in `tests/test_reports/`.
"""

from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock
import pytest
from app.services.coinbase_market_service import Candle
from app.services.prediction_constants import (
    OUTCOME_EXPIRED,
    OUTCOME_LOSS,
    OUTCOME_WIN,
    PREDICTION_STATUS_ACTIVE,
    PREDICTION_STATUS_COMPLETED,
    PREDICTION_STATUS_EXPIRED,
)
from app.services.prediction_evaluate_engine import (
    EvaluateTimings,
    EvaluationError,
    apply_evaluation_to_prediction,
    evaluate_from_candles,
    lower_bound_by_open_time,
    slice_candles_in_window,
)

UTC = timezone.utc
T0 = datetime(2024, 6, 1, 12, 0, tzinfo=UTC)

def _candle(
    minutes: int,
    *,
    low: float,
    high: float,
    open_: float | None = None,
    close: float | None = None,
) -> Candle:
    open_price = open_ if open_ is not None else (low + high) / 2
    close_price = close if close is not None else open_price
    return Candle(
        open_time=T0 + timedelta(minutes=minutes),
        open=open_price,
        high=high,
        low=low,
        close=close_price,
    )

def test_binary_search_lower_bound_and_slice():
    candles = [_candle(i, low=90, high=110) for i in range(0, 10)]
    assert lower_bound_by_open_time(candles, T0 + timedelta(minutes=4)) == 4
    sliced = slice_candles_in_window(
        candles, T0 + timedelta(minutes=3), T0 + timedelta(minutes=5)
    )
    assert [c.open_time.minute for c in sliced] == [3, 4, 5]

def test_long_win_target_first():
    candles = [
        _candle(0, low=99, high=101),
        _candle(1, low=100, high=111),  # target 110
        _candle(2, low=95, high=105),
    ]
    result = evaluate_from_candles(
        candles, position="long", entry=100, target=110, stop=95
    )
    assert result.outcome == OUTCOME_WIN
    assert result.hit_at == candles[1].open_time
    assert result.return_pct == pytest.approx(0.10)
    assert result.status == PREDICTION_STATUS_COMPLETED

def test_long_loss_stop_first():
    candles = [
        _candle(0, low=94, high=101),  # stop 95
        _candle(1, low=100, high=120),
    ]
    result = evaluate_from_candles(
        candles, position="long", entry=100, target=110, stop=95
    )
    assert result.outcome == OUTCOME_LOSS
    assert result.return_pct == pytest.approx(-0.05)

def test_short_win_and_loss():
    win = evaluate_from_candles(
        [_candle(0, low=88, high=101)],
        position="short",
        entry=100,
        target=90,
        stop=105,
    )
    assert win.outcome == OUTCOME_WIN
    assert win.return_pct == pytest.approx(0.10)

    loss = evaluate_from_candles(
        [_candle(0, low=95, high=106)],
        position="short",
        entry=100,
        target=90,
        stop=105,
    )
    assert loss.outcome == OUTCOME_LOSS

def test_dual_hit_same_candle_is_loss():
    candles = [_candle(0, low=90, high=120)]  # both stop 95 and target 110
    result = evaluate_from_candles(
        candles, position="long", entry=100, target=110, stop=95
    )
    assert result.outcome == OUTCOME_LOSS
    assert result.resolution_note == "dual_hit_same_candle"
    assert result.hit_at == candles[0].open_time

def test_expired_uses_last_close_hit_at_null():
    candles = [
        _candle(0, low=99, high=101, close=100.5),
        _candle(1, low=99, high=102, close=101.0),
    ]
    result = evaluate_from_candles(
        candles, position="long", entry=100, target=110, stop=90
    )
    assert result.outcome == OUTCOME_EXPIRED
    assert result.hit_at is None
    assert result.hit_price == 101.0
    assert result.return_pct == pytest.approx(0.01)
    assert result.status == PREDICTION_STATUS_EXPIRED

def test_empty_candles_raises():
    with pytest.raises(EvaluationError):
        evaluate_from_candles([], position="long", entry=100, target=110, stop=95)

def test_apply_is_idempotent():
    prediction = MagicMock()
    prediction.outcome = None
    prediction.status = PREDICTION_STATUS_ACTIVE
    result = evaluate_from_candles(
        [_candle(0, low=100, high=120)],
        position="long",
        entry=100,
        target=110,
        stop=95,
    )
    timings = EvaluateTimings()
    assert apply_evaluation_to_prediction(prediction, result, timings=timings) is True
    assert prediction.outcome == OUTCOME_WIN
    assert timings.apply_ms >= 0

    prediction.outcome = OUTCOME_WIN
    prediction.status = PREDICTION_STATUS_COMPLETED
    assert apply_evaluation_to_prediction(prediction, result) is False

def test_floor_to_interval_6h():
    from app.services.prediction_evaluate_engine import floor_to_interval

    mid = datetime(2024, 6, 1, 11, 9, tzinfo=UTC)
    assert floor_to_interval(mid, "6h") == datetime(2024, 6, 1, 6, 0, tzinfo=UTC)
    assert floor_to_interval(datetime(2024, 6, 1, 12, 0, tzinfo=UTC), "6h") == datetime(
        2024, 6, 1, 12, 0, tzinfo=UTC
    )

def test_expire_early_after_leading_partial_does_not_fetch_rest_of_ladder():
    """Mid-bucket start: no hit after leading zoom + remainder -> stop, not 8 fetches."""
    from app.services.prediction_evaluate_engine import evaluate_smart_search

    start = datetime(2024, 6, 1, 16, 58, tzinfo=UTC)
    end = datetime(2024, 6, 1, 17, 58, tzinfo=UTC)
    fetches: list[str] = []

    def mock_fetch(interval, _window_start, _window_end):
        fetches.append(interval)
        if interval == "1h":
            return [
                Candle(
                    open_time=datetime(2024, 6, 1, 16, 0, tzinfo=UTC),
                    open=100,
                    high=105,
                    low=99,
                    close=102,
                ),
                Candle(
                    open_time=datetime(2024, 6, 1, 17, 0, tzinfo=UTC),
                    open=102,
                    high=105,
                    low=101,
                    close=103,
                ),
            ]
        if interval == "15m":
            return [
                Candle(
                    open_time=datetime(2024, 6, 1, 16, 45, tzinfo=UTC),
                    open=100,
                    high=104,
                    low=99,
                    close=101,
                ),
                Candle(
                    open_time=datetime(2024, 6, 1, 17, 0, tzinfo=UTC),
                    open=101,
                    high=105,
                    low=100,
                    close=102,
                ),
            ]
        if interval == "1m":
            return [
                Candle(
                    open_time=datetime(2024, 6, 1, 16, 58, tzinfo=UTC),
                    open=100,
                    high=104,
                    low=99,
                    close=101,
                ),
                Candle(
                    open_time=datetime(2024, 6, 1, 16, 59, tzinfo=UTC),
                    open=101,
                    high=104,
                    low=100,
                    close=102,
                ),
                Candle(
                    open_time=datetime(2024, 6, 1, 17, 0, tzinfo=UTC),
                    open=102,
                    high=105,
                    low=101,
                    close=103,
                ),
            ]
        return []

    result = evaluate_smart_search(
        position="long",
        entry=100,
        target=200,
        stop=50,
        start_time=start,
        expiry_at=end,
        fetch_candles=mock_fetch,
        ladder=("1h", "15m", "1m"),
    )

    assert result.outcome == OUTCOME_EXPIRED
    assert result.hit_at is None
    assert fetches == ["1h", "15m", "1m"]

def test_expire_early_ignores_coarse_leading_partial_ohlc():
    """Leading partial OHLC from before pred start must not flip expire-early to win."""
    from app.services.prediction_evaluate_engine import evaluate_smart_search

    start = datetime(2024, 6, 1, 16, 58, tzinfo=UTC)
    end = datetime(2024, 6, 1, 17, 58, tzinfo=UTC)

    def mock_fetch(interval, _window_start, _window_end):
        if interval == "1h":
            return [
                Candle(
                    open_time=datetime(2024, 6, 1, 16, 0, tzinfo=UTC),
                    open=100,
                    high=200,
                    low=99,
                    close=102,
                ),
                Candle(
                    open_time=datetime(2024, 6, 1, 17, 0, tzinfo=UTC),
                    open=102,
                    high=105,
                    low=101,
                    close=103,
                ),
            ]
        if interval == "15m":
            return [
                Candle(
                    open_time=datetime(2024, 6, 1, 16, 45, tzinfo=UTC),
                    open=100,
                    high=104,
                    low=99,
                    close=101,
                ),
                Candle(
                    open_time=datetime(2024, 6, 1, 17, 0, tzinfo=UTC),
                    open=101,
                    high=105,
                    low=100,
                    close=102,
                ),
            ]
        if interval == "1m":
            return [
                Candle(
                    open_time=datetime(2024, 6, 1, 16, 58, tzinfo=UTC),
                    open=100,
                    high=104,
                    low=99,
                    close=101,
                ),
                Candle(
                    open_time=datetime(2024, 6, 1, 16, 59, tzinfo=UTC),
                    open=101,
                    high=104,
                    low=100,
                    close=102,
                ),
                Candle(
                    open_time=datetime(2024, 6, 1, 17, 0, tzinfo=UTC),
                    open=102,
                    high=105,
                    low=101,
                    close=103,
                ),
            ]
        return []

    result = evaluate_smart_search(
        position="long",
        entry=100,
        target=200,
        stop=50,
        start_time=start,
        expiry_at=end,
        fetch_candles=mock_fetch,
        ladder=("1h", "15m", "1m"),
    )

    assert result.outcome == OUTCOME_EXPIRED
    assert result.hit_at is None
    assert result.hit_price == 103
