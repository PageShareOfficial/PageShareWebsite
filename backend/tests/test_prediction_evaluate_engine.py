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
    evaluate_prediction_market,
    expiry_close_price,
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

def test_evaluate_prediction_market_reuses_injected_client_for_every_fetch():
    shared_client = object()
    seen_clients: list[object] = []

    def fake_get_candles(asset, interval, start, end, *, client=None):
        seen_clients.append(client)
        return [Candle(open_time=start, open=100, high=111, low=99.5, close=110)]

    result, timings = evaluate_prediction_market(
        asset="BTC",
        position="long",
        entry=100,
        target=110,
        stop=90,
        start_time=T0,
        expiry_at=T0 + timedelta(hours=2),
        get_candles_fn=fake_get_candles,
        client=shared_client,
    )

    assert result.outcome == OUTCOME_WIN
    assert seen_clients
    assert all(client is shared_client for client in seen_clients)
    assert timings.total_ms >= 0

EXPIRY = T0 + timedelta(hours=2)

def _quiet_candle(open_time: datetime, close: float) -> Candle:
    return Candle(open_time=open_time, open=100, high=102, low=99, close=close)

def _expired_market(minute_candles: list[Candle]):
    """Coarse bars never touch the levels; their close is a post-expiry price (101.9)."""

    def fake_get_candles(asset, interval, start, end, *, client=None):
        if interval == "1m":
            return minute_candles
        return [_quiet_candle(start, 101.9)]

    return fake_get_candles

def _evaluate_expired(fake_get_candles):
    return evaluate_prediction_market(
        asset="BTC",
        position="long",
        entry=100,
        target=110,
        stop=90,
        start_time=T0,
        expiry_at=EXPIRY,
        get_candles_fn=fake_get_candles,
    )

def test_expired_exit_uses_last_minute_closed_by_expiry():
    minute_candles = [
        _quiet_candle(EXPIRY - timedelta(minutes=2), 101.0),
        _quiet_candle(EXPIRY - timedelta(minutes=1), 101.5),
        _quiet_candle(EXPIRY, 555.0),  # opens at expiry, closes after it: excluded
    ]

    result, _timings = _evaluate_expired(_expired_market(minute_candles))

    assert result.outcome == OUTCOME_EXPIRED
    assert result.status == PREDICTION_STATUS_EXPIRED
    assert result.hit_at is None
    assert result.hit_price == pytest.approx(101.5)
    assert result.return_pct == pytest.approx(0.015)

def test_expired_exit_short_return_uses_expiry_price():
    minute_candles = [_quiet_candle(EXPIRY - timedelta(minutes=1), 98.0)]

    result, _timings = evaluate_prediction_market(
        asset="BTC",
        position="short",
        entry=100,
        target=90,
        stop=110,
        start_time=T0,
        expiry_at=EXPIRY,
        get_candles_fn=_expired_market(minute_candles),
    )

    assert result.outcome == OUTCOME_EXPIRED
    assert result.hit_price == pytest.approx(98.0)
    assert result.return_pct == pytest.approx(0.02)

def test_expired_exit_keeps_coarse_price_when_no_minute_data():
    result, _timings = _evaluate_expired(_expired_market([]))

    assert result.outcome == OUTCOME_EXPIRED
    assert result.hit_price == pytest.approx(101.9)

def test_expiry_close_price_ignores_candles_still_open_at_expiry():
    candles = [
        _quiet_candle(EXPIRY - timedelta(minutes=1), 101.5),
        _quiet_candle(EXPIRY, 555.0),
    ]
    assert expiry_close_price(candles, EXPIRY) == pytest.approx(101.5)
    assert expiry_close_price(candles[1:], EXPIRY) is None
    assert expiry_close_price([], EXPIRY) is None
