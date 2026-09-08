# Live short-window floor confirmation (30m / 1h)

Generated: `2026-07-20T18:01:46.748993+00:00` (UTC)
Asset: **BTC**

Goal: prove mid-bucket prediction starts are covered via `floor_to_interval` + **leading partial zoom**, not skipped until the next aligned candle open.

## Summary

| Case | Duration | Floor + leading | Outcome | hit_at in window |
|------|----------|-----------------|---------|------------------|
| zoom near high | 30m | yes | **win** | yes (`17:52:00Z`) |
| zoom near low | 30m | yes | **loss** | yes (`17:30:00Z`) |
| wide levels | 30m | yes | **expired** | n/a |
| zoom near high | 1h | yes | **win** | yes (`17:00:00Z`) |
| zoom near low | 1h | yes | **loss** | yes (`17:02:00Z`) |
| wide levels | 1h | yes | **expired** | n/a |

All six cases logged floored fetches and LEADING GAP zooms. Engine also **resumes** after a clean leading remainder (so later bars in the same window are not dropped).

Re-run: `python tests/test_live_evaluate_short_window_floor.py` from `backend/` with `$env:PYTHONPATH = "."`.

---

## 30-minute prediction — zoom near high

- Duration: **30.0 minutes**
- start=`2026-07-20T17:28:46.748993+00:00` expiry=`2026-07-20T17:58:46.748993+00:00`
- floor(`6h`)=`2026-07-20T12:00:00+00:00`
- floor(`1h`)=`2026-07-20T17:00:00+00:00`
- Minutes after floored 6h open until prediction start: **~329 min**

## Search ladder
- Ladder: `6h -> 1h -> 15m -> 1m`
- Prediction window: `2026-07-20T17:28:46.748993+00:00` -> `2026-07-20T17:58:46.748993+00:00`
- Levels (long): entry=65446.91 target=65479.67 stop=64137.97

### Step 1: fetch `6h`
- Search window: `2026-07-20T17:28:46.748993+00:00` -> `2026-07-20T17:58:46.748993+00:00`
- Fetch from floored open `2026-07-20T12:00:00+00:00` (covers mid-bucket start)
- Fetched **1** candle(s) in **1162 ms**
  - `6h` open=2026-07-20T12:00:00+00:00  O=64944.01 H=65626.04 L=64010.00 C=65533.52  << LEADING PARTIAL (opens before prediction start)
- **LEADING GAP:** bar opened `2026-07-20T12:00:00+00:00` but prediction starts `2026-07-20T17:28:46.748993+00:00` — do not trust full-bar OHLC.
- **Nested refine leading remainder** `2026-07-20T17:28:46.748993+00:00` -> `2026-07-20T17:58:46.748993+00:00`

  ## Search ladder
  - Ladder: `1h -> 15m -> 1m`
  - Prediction window: `2026-07-20T17:28:46.748993+00:00` -> `2026-07-20T17:58:46.748993+00:00`
  - Levels (long): entry=65446.91 target=65479.67 stop=64137.97

  ### Step 1: fetch `1h`
  - Search window: `2026-07-20T17:28:46.748993+00:00` -> `2026-07-20T17:58:46.748993+00:00`
  - Fetch from floored open `2026-07-20T17:00:00+00:00` (covers mid-bucket start)
  - Fetched **1** candle(s) in **579 ms**
    - `1h` open=2026-07-20T17:00:00+00:00  O=65454.01 H=65610.89 L=65282.93 C=65533.52  << LEADING PARTIAL (opens before prediction start)
  - **LEADING GAP:** bar opened `2026-07-20T17:00:00+00:00` but prediction starts `2026-07-20T17:28:46.748993+00:00` — do not trust full-bar OHLC.
  - **Nested refine leading remainder** `2026-07-20T17:28:46.748993+00:00` -> `2026-07-20T17:58:46.748993+00:00`

    ## Search ladder
    - Ladder: `15m -> 1m`
    - Prediction window: `2026-07-20T17:28:46.748993+00:00` -> `2026-07-20T17:58:46.748993+00:00`
    - Levels (long): entry=65446.91 target=65479.67 stop=64137.97

    ### Step 1: fetch `15m`
    - Search window: `2026-07-20T17:28:46.748993+00:00` -> `2026-07-20T17:58:46.748993+00:00`
    - Fetch from floored open `2026-07-20T17:15:00+00:00` (covers mid-bucket start)
    - Fetched **3** candle(s) in **1119 ms**
      - `15m` open=2026-07-20T17:15:00+00:00  O=65444.40 H=65464.52 L=65373.02 C=65452.03  << LEADING PARTIAL (opens before prediction start)
      - `15m` open=2026-07-20T17:30:00+00:00  O=65452.03 H=65459.23 L=65282.93 C=65309.60
      - `15m` open=2026-07-20T17:45:00+00:00  O=65309.60 H=65610.89 L=65309.60 C=65533.52  << INTERESTING (win)
    - **LEADING GAP:** bar opened `2026-07-20T17:15:00+00:00` but prediction starts `2026-07-20T17:28:46.748993+00:00` — do not trust full-bar OHLC.
    - **Nested refine leading remainder** `2026-07-20T17:28:46.748993+00:00` -> `2026-07-20T17:30:00+00:00`

      ## Search ladder
      - Ladder: `1m`
      - Prediction window: `2026-07-20T17:28:46.748993+00:00` -> `2026-07-20T17:30:00+00:00`
      - Levels (long): entry=65446.91 target=65479.67 stop=64137.97

      ### Step 1: fetch `1m`
      - Search window: `2026-07-20T17:28:46.748993+00:00` -> `2026-07-20T17:30:00+00:00`
      - Fetch from floored open `2026-07-20T17:28:00+00:00` (covers mid-bucket start)
      - Fetched **3** candle(s) in **1165 ms**
        - `1m` open=2026-07-20T17:28:00+00:00  O=65422.15 H=65449.42 L=65422.15 C=65437.55  << LEADING PARTIAL (opens before prediction start)
        - `1m` open=2026-07-20T17:29:00+00:00  O=65437.55 H=65453.35 L=65429.99 C=65452.03
        - `1m` open=2026-07-20T17:30:00+00:00  O=65452.03 H=65459.23 L=65411.01 C=65418.36
      - **No level touch on coarse full window** -> expire early (no finer fetches).

    - Leading remainder clean — **resume** later candles at this interval.
    - **First interesting candle at `15m`:** `2026-07-20T17:45:00+00:00` — TARGET hit (65479.67) on high=65610.89
    - **ZOOM into candle** `2026-07-20T17:45:00+00:00` (15m bar, span 0:15:00) -> next fetch `2026-07-20T17:45:00+00:00` -> `2026-07-20T17:58:46.748993+00:00`

    ### Step 2: fetch `1m`
    - Search window: `2026-07-20T17:45:00+00:00` -> `2026-07-20T17:58:46.748993+00:00`
    - Fetch from floored open `2026-07-20T17:45:00+00:00` (covers mid-bucket start)
    - Fetched **14** candle(s) in **1960 ms**
      - `1m` open=2026-07-20T17:45:00+00:00  O=65309.60 H=65369.99 L=65309.60 C=65369.99
      - `1m` open=2026-07-20T17:46:00+00:00  O=65369.99 H=65372.80 L=65344.23 C=65351.65
      - `1m` open=2026-07-20T17:47:00+00:00  O=65351.65 H=65369.51 L=65351.65 C=65369.51
      - `1m` open=2026-07-20T17:48:00+00:00  O=65369.51 H=65400.29 L=65348.85 C=65400.28
      - `1m` open=2026-07-20T17:49:00+00:00  O=65400.28 H=65427.36 L=65385.04 C=65427.36
      - `1m` open=2026-07-20T17:50:00+00:00  O=65427.36 H=65430.33 L=65410.22 C=65419.47
      - `1m` open=2026-07-20T17:51:00+00:00  O=65419.47 H=65464.30 L=65409.71 C=65455.54
      - `1m` open=2026-07-20T17:52:00+00:00  O=65455.53 H=65500.00 L=65455.53 C=65457.08  << INTERESTING (win)
      - `1m` open=2026-07-20T17:53:00+00:00  O=65457.08 H=65483.81 L=65450.53 C=65467.49  << INTERESTING (win)
      - `1m` open=2026-07-20T17:54:00+00:00  O=65462.95 H=65610.89 L=65458.00 C=65527.08  << INTERESTING (win)
      - `1m` open=2026-07-20T17:55:00+00:00  O=65527.09 H=65527.09 L=65496.48 C=65507.83  << INTERESTING (win)
      - `1m` open=2026-07-20T17:56:00+00:00  O=65507.83 H=65531.12 L=65501.85 C=65503.76  << INTERESTING (win)
      - `1m` open=2026-07-20T17:57:00+00:00  O=65503.76 H=65597.08 L=65501.29 C=65559.41  << INTERESTING (win)
      - `1m` open=2026-07-20T17:58:00+00:00  O=65559.41 H=65569.49 L=65533.51 C=65540.91  << INTERESTING (win)
    - **First interesting candle at `1m`:** `2026-07-20T17:52:00+00:00` — TARGET hit (65479.67) on high=65500.00
    - Finest interval `1m` — **search result locked** on this candle.

## Final search result
- **outcome:** `win`
- **hit_price:** `65479.67`
- **hit_at:** `2026-07-20T17:52:00+00:00`
- **return_pct:** `0.000501`
- **resolution_note:** `None`
- **timings:** fetches=5, candles_scanned=22, fetch_ms=5985, search_ms=5986, by_interval={6h:1162ms, 1h:579ms, 15m:1119ms, 1m:3125ms}

### Floor check
- Floored fetch logged: **True**
- Leading partial / leading gap zoom logged: **True**
- hit_at inside prediction window: **True** (`2026-07-20T17:52:00+00:00`)

---

## 30-minute prediction — zoom near low

- Duration: **30.0 minutes**
- start=`2026-07-20T17:28:46.748993+00:00` expiry=`2026-07-20T17:58:46.748993+00:00`
- floor(`6h`)=`2026-07-20T12:00:00+00:00`
- floor(`1h`)=`2026-07-20T17:00:00+00:00`
- Minutes after floored 6h open until prediction start: **~329 min**

## Search ladder
- Ladder: `6h -> 1h -> 15m -> 1m`
- Prediction window: `2026-07-20T17:28:46.748993+00:00` -> `2026-07-20T17:58:46.748993+00:00`
- Levels (long): entry=65446.91 target=70859.76 stop=65413.50

### Step 1: fetch `6h`
- Search window: `2026-07-20T17:28:46.748993+00:00` -> `2026-07-20T17:58:46.748993+00:00`
- Fetch from floored open `2026-07-20T12:00:00+00:00` (covers mid-bucket start)
- Fetched **1** candle(s) in **380 ms**
  - `6h` open=2026-07-20T12:00:00+00:00  O=64944.01 H=65626.04 L=64010.00 C=65533.52  << LEADING PARTIAL (opens before prediction start)
- **LEADING GAP:** bar opened `2026-07-20T12:00:00+00:00` but prediction starts `2026-07-20T17:28:46.748993+00:00` — do not trust full-bar OHLC.
- **Nested refine leading remainder** `2026-07-20T17:28:46.748993+00:00` -> `2026-07-20T17:58:46.748993+00:00`

  ## Search ladder
  - Ladder: `1h -> 15m -> 1m`
  - Prediction window: `2026-07-20T17:28:46.748993+00:00` -> `2026-07-20T17:58:46.748993+00:00`
  - Levels (long): entry=65446.91 target=70859.76 stop=65413.50

  ### Step 1: fetch `1h`
  - Search window: `2026-07-20T17:28:46.748993+00:00` -> `2026-07-20T17:58:46.748993+00:00`
  - Fetch from floored open `2026-07-20T17:00:00+00:00` (covers mid-bucket start)
  - Fetched **1** candle(s) in **378 ms**
    - `1h` open=2026-07-20T17:00:00+00:00  O=65454.01 H=65610.89 L=65282.93 C=65533.52  << LEADING PARTIAL (opens before prediction start)
  - **LEADING GAP:** bar opened `2026-07-20T17:00:00+00:00` but prediction starts `2026-07-20T17:28:46.748993+00:00` — do not trust full-bar OHLC.
  - **Nested refine leading remainder** `2026-07-20T17:28:46.748993+00:00` -> `2026-07-20T17:58:46.748993+00:00`

    ## Search ladder
    - Ladder: `15m -> 1m`
    - Prediction window: `2026-07-20T17:28:46.748993+00:00` -> `2026-07-20T17:58:46.748993+00:00`
    - Levels (long): entry=65446.91 target=70859.76 stop=65413.50

    ### Step 1: fetch `15m`
    - Search window: `2026-07-20T17:28:46.748993+00:00` -> `2026-07-20T17:58:46.748993+00:00`
    - Fetch from floored open `2026-07-20T17:15:00+00:00` (covers mid-bucket start)
    - Fetched **3** candle(s) in **377 ms**
      - `15m` open=2026-07-20T17:15:00+00:00  O=65444.40 H=65464.52 L=65373.02 C=65452.03  << LEADING PARTIAL (opens before prediction start)
      - `15m` open=2026-07-20T17:30:00+00:00  O=65452.03 H=65459.23 L=65282.93 C=65309.60  << INTERESTING (loss)
      - `15m` open=2026-07-20T17:45:00+00:00  O=65309.60 H=65610.89 L=65309.60 C=65533.52  << INTERESTING (loss)
    - **LEADING GAP:** bar opened `2026-07-20T17:15:00+00:00` but prediction starts `2026-07-20T17:28:46.748993+00:00` — do not trust full-bar OHLC.
    - **Nested refine leading remainder** `2026-07-20T17:28:46.748993+00:00` -> `2026-07-20T17:30:00+00:00`

      ## Search ladder
      - Ladder: `1m`
      - Prediction window: `2026-07-20T17:28:46.748993+00:00` -> `2026-07-20T17:30:00+00:00`
      - Levels (long): entry=65446.91 target=70859.76 stop=65413.50

      ### Step 1: fetch `1m`
      - Search window: `2026-07-20T17:28:46.748993+00:00` -> `2026-07-20T17:30:00+00:00`
      - Fetch from floored open `2026-07-20T17:28:00+00:00` (covers mid-bucket start)
      - Fetched **3** candle(s) in **378 ms**
        - `1m` open=2026-07-20T17:28:00+00:00  O=65422.15 H=65449.42 L=65422.15 C=65437.55  << LEADING PARTIAL (opens before prediction start)
        - `1m` open=2026-07-20T17:29:00+00:00  O=65437.55 H=65453.35 L=65429.99 C=65452.03
        - `1m` open=2026-07-20T17:30:00+00:00  O=65452.03 H=65459.23 L=65411.01 C=65418.36  << INTERESTING (loss)
      - **First interesting candle at `1m`:** `2026-07-20T17:30:00+00:00` — STOP hit (65413.50) on low=65411.01
      - Finest interval `1m` — **search result locked** on this candle.

## Final search result
- **outcome:** `loss`
- **hit_price:** `65413.50`
- **hit_at:** `2026-07-20T17:30:00+00:00`
- **return_pct:** `-0.000511`
- **resolution_note:** `None`
- **timings:** fetches=4, candles_scanned=8, fetch_ms=1513, search_ms=1513, by_interval={6h:380ms, 1h:378ms, 15m:377ms, 1m:378ms}

### Floor check
- Floored fetch logged: **True**
- Leading partial / leading gap zoom logged: **True**
- hit_at inside prediction window: **True** (`2026-07-20T17:30:00+00:00`)

---

## 30-minute prediction — wide levels (expect expired)

- Duration: **30.0 minutes**
- start=`2026-07-20T17:28:46.748993+00:00` expiry=`2026-07-20T17:58:46.748993+00:00`
- floor(`6h`)=`2026-07-20T12:00:00+00:00`
- floor(`1h`)=`2026-07-20T17:00:00+00:00`
- Minutes after floored 6h open until prediction start: **~329 min**

## Search ladder
- Ladder: `6h -> 1h -> 15m -> 1m`
- Prediction window: `2026-07-20T17:28:46.748993+00:00` -> `2026-07-20T17:58:46.748993+00:00`
- Levels (long): entry=65446.91 target=81808.64 stop=49085.18

### Step 1: fetch `6h`
- Search window: `2026-07-20T17:28:46.748993+00:00` -> `2026-07-20T17:58:46.748993+00:00`
- Fetch from floored open `2026-07-20T12:00:00+00:00` (covers mid-bucket start)
- Fetched **1** candle(s) in **399 ms**
  - `6h` open=2026-07-20T12:00:00+00:00  O=64944.01 H=65626.04 L=64010.00 C=65533.52  << LEADING PARTIAL (opens before prediction start)
- **LEADING GAP:** bar opened `2026-07-20T12:00:00+00:00` but prediction starts `2026-07-20T17:28:46.748993+00:00` — do not trust full-bar OHLC.
- **Nested refine leading remainder** `2026-07-20T17:28:46.748993+00:00` -> `2026-07-20T17:58:46.748993+00:00`

  ## Search ladder
  - Ladder: `1h -> 15m -> 1m`
  - Prediction window: `2026-07-20T17:28:46.748993+00:00` -> `2026-07-20T17:58:46.748993+00:00`
  - Levels (long): entry=65446.91 target=81808.64 stop=49085.18

  ### Step 1: fetch `1h`
  - Search window: `2026-07-20T17:28:46.748993+00:00` -> `2026-07-20T17:58:46.748993+00:00`
  - Fetch from floored open `2026-07-20T17:00:00+00:00` (covers mid-bucket start)
  - Fetched **1** candle(s) in **421 ms**
    - `1h` open=2026-07-20T17:00:00+00:00  O=65454.01 H=65610.89 L=65282.93 C=65533.52  << LEADING PARTIAL (opens before prediction start)
  - **LEADING GAP:** bar opened `2026-07-20T17:00:00+00:00` but prediction starts `2026-07-20T17:28:46.748993+00:00` — do not trust full-bar OHLC.
  - **Nested refine leading remainder** `2026-07-20T17:28:46.748993+00:00` -> `2026-07-20T17:58:46.748993+00:00`

    ## Search ladder
    - Ladder: `15m -> 1m`
    - Prediction window: `2026-07-20T17:28:46.748993+00:00` -> `2026-07-20T17:58:46.748993+00:00`
    - Levels (long): entry=65446.91 target=81808.64 stop=49085.18

    ### Step 1: fetch `15m`
    - Search window: `2026-07-20T17:28:46.748993+00:00` -> `2026-07-20T17:58:46.748993+00:00`
    - Fetch from floored open `2026-07-20T17:15:00+00:00` (covers mid-bucket start)
    - Fetched **3** candle(s) in **416 ms**
      - `15m` open=2026-07-20T17:15:00+00:00  O=65444.40 H=65464.52 L=65373.02 C=65452.03  << LEADING PARTIAL (opens before prediction start)
      - `15m` open=2026-07-20T17:30:00+00:00  O=65452.03 H=65459.23 L=65282.93 C=65309.60
      - `15m` open=2026-07-20T17:45:00+00:00  O=65309.60 H=65610.89 L=65309.60 C=65533.52
    - **LEADING GAP:** bar opened `2026-07-20T17:15:00+00:00` but prediction starts `2026-07-20T17:28:46.748993+00:00` — do not trust full-bar OHLC.
    - **Nested refine leading remainder** `2026-07-20T17:28:46.748993+00:00` -> `2026-07-20T17:30:00+00:00`

      ## Search ladder
      - Ladder: `1m`
      - Prediction window: `2026-07-20T17:28:46.748993+00:00` -> `2026-07-20T17:30:00+00:00`
      - Levels (long): entry=65446.91 target=81808.64 stop=49085.18

      ### Step 1: fetch `1m`
      - Search window: `2026-07-20T17:28:46.748993+00:00` -> `2026-07-20T17:30:00+00:00`
      - Fetch from floored open `2026-07-20T17:28:00+00:00` (covers mid-bucket start)
      - Fetched **3** candle(s) in **343 ms**
        - `1m` open=2026-07-20T17:28:00+00:00  O=65422.15 H=65449.42 L=65422.15 C=65437.55  << LEADING PARTIAL (opens before prediction start)
        - `1m` open=2026-07-20T17:29:00+00:00  O=65437.55 H=65453.35 L=65429.99 C=65452.03
        - `1m` open=2026-07-20T17:30:00+00:00  O=65452.03 H=65459.23 L=65411.01 C=65418.36
      - **No level touch on coarse full window** -> expire early (no finer fetches).

    - Leading remainder clean — **resume** later candles at this interval.
    - No further hits after leading remainder.

    ### Step 2: fetch `1m`
    - Search window: `2026-07-20T17:28:46.748993+00:00` -> `2026-07-20T17:58:46.748993+00:00`
    - Fetch from floored open `2026-07-20T17:28:00+00:00` (covers mid-bucket start)
    - Fetched **31** candle(s) in **377 ms**
      - `1m` open=2026-07-20T17:28:00+00:00  O=65422.15 H=65449.42 L=65422.15 C=65437.55  << LEADING PARTIAL (opens before prediction start)
      - `1m` open=2026-07-20T17:29:00+00:00  O=65437.55 H=65453.35 L=65429.99 C=65452.03
      - `1m` open=2026-07-20T17:30:00+00:00  O=65452.03 H=65459.23 L=65411.01 C=65418.36
      - `1m` open=2026-07-20T17:31:00+00:00  O=65418.36 H=65418.37 L=65404.26 C=65409.61
      - `1m` open=2026-07-20T17:32:00+00:00  O=65411.18 H=65436.98 L=65392.46 C=65404.76
      - `1m` open=2026-07-20T17:33:00+00:00  O=65404.75 H=65415.99 L=65392.46 C=65395.36
      - `1m` open=2026-07-20T17:34:00+00:00  O=65395.36 H=65407.29 L=65373.91 C=65373.91
      - `1m` open=2026-07-20T17:35:00+00:00  O=65373.91 H=65373.92 L=65352.72 C=65367.85
      - `1m` open=2026-07-20T17:36:00+00:00  O=65366.49 H=65374.84 L=65344.01 C=65363.09
      - `1m` open=2026-07-20T17:37:00+00:00  O=65363.10 H=65399.88 L=65363.10 C=65388.36
      - `1m` open=2026-07-20T17:38:00+00:00  O=65388.36 H=65396.16 L=65370.77 C=65373.66
      - `1m` open=2026-07-20T17:39:00+00:00  O=65373.65 H=65381.71 L=65350.14 C=65350.15
      - `1m` open=2026-07-20T17:40:00+00:00  O=65350.14 H=65354.18 L=65324.00 C=65329.12
      - `1m` open=2026-07-20T17:41:00+00:00  O=65329.13 H=65339.82 L=65325.88 C=65339.82
      - `1m` open=2026-07-20T17:42:00+00:00  O=65339.82 H=65358.64 L=65330.00 C=65340.50
      - `1m` open=2026-07-20T17:43:00+00:00  O=65340.50 H=65352.95 L=65321.52 C=65321.52
      - `1m` open=2026-07-20T17:44:00+00:00  O=65321.52 H=65332.37 L=65282.93 C=65309.60
      - `1m` open=2026-07-20T17:45:00+00:00  O=65309.60 H=65369.99 L=65309.60 C=65369.99
      - `1m` open=2026-07-20T17:46:00+00:00  O=65369.99 H=65372.80 L=65344.23 C=65351.65
      - `1m` open=2026-07-20T17:47:00+00:00  O=65351.65 H=65369.51 L=65351.65 C=65369.51
      - `1m` open=2026-07-20T17:48:00+00:00  O=65369.51 H=65400.29 L=65348.85 C=65400.28
      - `1m` open=2026-07-20T17:49:00+00:00  O=65400.28 H=65427.36 L=65385.04 C=65427.36
      - `1m` open=2026-07-20T17:50:00+00:00  O=65427.36 H=65430.33 L=65410.22 C=65419.47
      - `1m` open=2026-07-20T17:51:00+00:00  O=65419.47 H=65464.30 L=65409.71 C=65455.54
      - `1m` open=2026-07-20T17:52:00+00:00  O=65455.53 H=65500.00 L=65455.53 C=65457.08
      - `1m` open=2026-07-20T17:53:00+00:00  O=65457.08 H=65483.81 L=65450.53 C=65467.49
      - `1m` open=2026-07-20T17:54:00+00:00  O=65462.95 H=65610.89 L=65458.00 C=65527.08
      - `1m` open=2026-07-20T17:55:00+00:00  O=65527.09 H=65527.09 L=65496.48 C=65507.83
      - `1m` open=2026-07-20T17:56:00+00:00  O=65507.83 H=65531.12 L=65501.85 C=65503.76
      - `1m` open=2026-07-20T17:57:00+00:00  O=65503.76 H=65597.08 L=65501.29 C=65559.41
      - `1m` open=2026-07-20T17:58:00+00:00  O=65559.41 H=65569.49 L=65533.51 C=65540.91
    - No hit in this zoomed slice -> try next interval.

## Final search result
- **outcome:** `expired`
- **hit_price:** `65540.91`
- **hit_at:** `null`
- **return_pct:** `0.001436`
- **resolution_note:** `neither_level_hit`
- **timings:** fetches=5, candles_scanned=39, fetch_ms=1957, search_ms=1957, by_interval={6h:399ms, 1h:421ms, 15m:416ms, 1m:721ms}

### Floor check
- Floored fetch logged: **True**
- Leading partial / leading gap zoom logged: **True**
- hit_at: `null` (expired path)

---

## 1-hour prediction — zoom near high

- Duration: **60.0 minutes**
- start=`2026-07-20T16:58:46.748993+00:00` expiry=`2026-07-20T17:58:46.748993+00:00`
- floor(`6h`)=`2026-07-20T12:00:00+00:00`
- floor(`1h`)=`2026-07-20T16:00:00+00:00`
- Minutes after floored 6h open until prediction start: **~299 min**

## Search ladder
- Ladder: `6h -> 1h -> 15m -> 1m`
- Prediction window: `2026-07-20T16:58:46.748993+00:00` -> `2026-07-20T17:58:46.748993+00:00`
- Levels (long): entry=65446.91 target=65479.67 stop=64137.97

### Step 1: fetch `6h`
- Search window: `2026-07-20T16:58:46.748993+00:00` -> `2026-07-20T17:58:46.748993+00:00`
- Fetch from floored open `2026-07-20T12:00:00+00:00` (covers mid-bucket start)
- Fetched **1** candle(s) in **327 ms**
  - `6h` open=2026-07-20T12:00:00+00:00  O=64944.01 H=65626.04 L=64010.00 C=65533.52  << LEADING PARTIAL (opens before prediction start)
- **LEADING GAP:** bar opened `2026-07-20T12:00:00+00:00` but prediction starts `2026-07-20T16:58:46.748993+00:00` — do not trust full-bar OHLC.
- **Nested refine leading remainder** `2026-07-20T16:58:46.748993+00:00` -> `2026-07-20T17:58:46.748993+00:00`

  ## Search ladder
  - Ladder: `1h -> 15m -> 1m`
  - Prediction window: `2026-07-20T16:58:46.748993+00:00` -> `2026-07-20T17:58:46.748993+00:00`
  - Levels (long): entry=65446.91 target=65479.67 stop=64137.97

  ### Step 1: fetch `1h`
  - Search window: `2026-07-20T16:58:46.748993+00:00` -> `2026-07-20T17:58:46.748993+00:00`
  - Fetch from floored open `2026-07-20T16:00:00+00:00` (covers mid-bucket start)
  - Fetched **2** candle(s) in **565 ms**
    - `1h` open=2026-07-20T16:00:00+00:00  O=65550.00 H=65592.82 L=65283.63 C=65454.01  << LEADING PARTIAL (opens before prediction start)
    - `1h` open=2026-07-20T17:00:00+00:00  O=65454.01 H=65610.89 L=65282.93 C=65533.52  << INTERESTING (win)
  - **LEADING GAP:** bar opened `2026-07-20T16:00:00+00:00` but prediction starts `2026-07-20T16:58:46.748993+00:00` — do not trust full-bar OHLC.
  - **Nested refine leading remainder** `2026-07-20T16:58:46.748993+00:00` -> `2026-07-20T17:00:00+00:00`

    ## Search ladder
    - Ladder: `15m -> 1m`
    - Prediction window: `2026-07-20T16:58:46.748993+00:00` -> `2026-07-20T17:00:00+00:00`
    - Levels (long): entry=65446.91 target=65479.67 stop=64137.97

    ### Step 1: fetch `15m`
    - Search window: `2026-07-20T16:58:46.748993+00:00` -> `2026-07-20T17:00:00+00:00`
    - Fetch from floored open `2026-07-20T16:45:00+00:00` (covers mid-bucket start)
    - Fetched **2** candle(s) in **359 ms**
      - `15m` open=2026-07-20T16:45:00+00:00  O=65327.94 H=65464.30 L=65311.00 C=65454.01  << LEADING PARTIAL (opens before prediction start)
      - `15m` open=2026-07-20T17:00:00+00:00  O=65454.01 H=65500.00 L=65385.04 C=65444.40  << INTERESTING (win)
    - **LEADING GAP:** bar opened `2026-07-20T16:45:00+00:00` but prediction starts `2026-07-20T16:58:46.748993+00:00` — do not trust full-bar OHLC.
    - **Nested refine leading remainder** `2026-07-20T16:58:46.748993+00:00` -> `2026-07-20T17:00:00+00:00`

      ## Search ladder
      - Ladder: `1m`
      - Prediction window: `2026-07-20T16:58:46.748993+00:00` -> `2026-07-20T17:00:00+00:00`
      - Levels (long): entry=65446.91 target=65479.67 stop=64137.97

      ### Step 1: fetch `1m`
      - Search window: `2026-07-20T16:58:46.748993+00:00` -> `2026-07-20T17:00:00+00:00`
      - Fetch from floored open `2026-07-20T16:58:00+00:00` (covers mid-bucket start)
      - Fetched **3** candle(s) in **1164 ms**
        - `1m` open=2026-07-20T16:58:00+00:00  O=65394.99 H=65429.97 L=65380.01 C=65427.80  << LEADING PARTIAL (opens before prediction start)
        - `1m` open=2026-07-20T16:59:00+00:00  O=65427.81 H=65454.02 L=65427.80 C=65454.01
        - `1m` open=2026-07-20T17:00:00+00:00  O=65454.01 H=65488.45 L=65440.00 C=65468.26  << INTERESTING (win)
      - **First interesting candle at `1m`:** `2026-07-20T17:00:00+00:00` — TARGET hit (65479.67) on high=65488.45
      - Finest interval `1m` — **search result locked** on this candle.

## Final search result
- **outcome:** `win`
- **hit_price:** `65479.67`
- **hit_at:** `2026-07-20T17:00:00+00:00`
- **return_pct:** `0.000501`
- **resolution_note:** `None`
- **timings:** fetches=4, candles_scanned=8, fetch_ms=2414, search_ms=2415, by_interval={6h:327ms, 1h:565ms, 15m:359ms, 1m:1164ms}

### Floor check
- Floored fetch logged: **True**
- Leading partial / leading gap zoom logged: **True**
- hit_at inside prediction window: **True** (`2026-07-20T17:00:00+00:00`)

---

## 1-hour prediction — zoom near low

- Duration: **60.0 minutes**
- start=`2026-07-20T16:58:46.748993+00:00` expiry=`2026-07-20T17:58:46.748993+00:00`
- floor(`6h`)=`2026-07-20T12:00:00+00:00`
- floor(`1h`)=`2026-07-20T16:00:00+00:00`
- Minutes after floored 6h open until prediction start: **~299 min**

## Search ladder
- Ladder: `6h -> 1h -> 15m -> 1m`
- Prediction window: `2026-07-20T16:58:46.748993+00:00` -> `2026-07-20T17:58:46.748993+00:00`
- Levels (long): entry=65446.91 target=70859.76 stop=65413.50

### Step 1: fetch `6h`
- Search window: `2026-07-20T16:58:46.748993+00:00` -> `2026-07-20T17:58:46.748993+00:00`
- Fetch from floored open `2026-07-20T12:00:00+00:00` (covers mid-bucket start)
- Fetched **1** candle(s) in **331 ms**
  - `6h` open=2026-07-20T12:00:00+00:00  O=64944.01 H=65626.04 L=64010.00 C=65533.52  << LEADING PARTIAL (opens before prediction start)
- **LEADING GAP:** bar opened `2026-07-20T12:00:00+00:00` but prediction starts `2026-07-20T16:58:46.748993+00:00` — do not trust full-bar OHLC.
- **Nested refine leading remainder** `2026-07-20T16:58:46.748993+00:00` -> `2026-07-20T17:58:46.748993+00:00`

  ## Search ladder
  - Ladder: `1h -> 15m -> 1m`
  - Prediction window: `2026-07-20T16:58:46.748993+00:00` -> `2026-07-20T17:58:46.748993+00:00`
  - Levels (long): entry=65446.91 target=70859.76 stop=65413.50

  ### Step 1: fetch `1h`
  - Search window: `2026-07-20T16:58:46.748993+00:00` -> `2026-07-20T17:58:46.748993+00:00`
  - Fetch from floored open `2026-07-20T16:00:00+00:00` (covers mid-bucket start)
  - Fetched **2** candle(s) in **338 ms**
    - `1h` open=2026-07-20T16:00:00+00:00  O=65550.00 H=65592.82 L=65283.63 C=65454.01  << LEADING PARTIAL (opens before prediction start)
    - `1h` open=2026-07-20T17:00:00+00:00  O=65454.01 H=65610.89 L=65282.93 C=65533.52  << INTERESTING (loss)
  - **LEADING GAP:** bar opened `2026-07-20T16:00:00+00:00` but prediction starts `2026-07-20T16:58:46.748993+00:00` — do not trust full-bar OHLC.
  - **Nested refine leading remainder** `2026-07-20T16:58:46.748993+00:00` -> `2026-07-20T17:00:00+00:00`

    ## Search ladder
    - Ladder: `15m -> 1m`
    - Prediction window: `2026-07-20T16:58:46.748993+00:00` -> `2026-07-20T17:00:00+00:00`
    - Levels (long): entry=65446.91 target=70859.76 stop=65413.50

    ### Step 1: fetch `15m`
    - Search window: `2026-07-20T16:58:46.748993+00:00` -> `2026-07-20T17:00:00+00:00`
    - Fetch from floored open `2026-07-20T16:45:00+00:00` (covers mid-bucket start)
    - Fetched **2** candle(s) in **373 ms**
      - `15m` open=2026-07-20T16:45:00+00:00  O=65327.94 H=65464.30 L=65311.00 C=65454.01  << LEADING PARTIAL (opens before prediction start)
      - `15m` open=2026-07-20T17:00:00+00:00  O=65454.01 H=65500.00 L=65385.04 C=65444.40  << INTERESTING (loss)
    - **LEADING GAP:** bar opened `2026-07-20T16:45:00+00:00` but prediction starts `2026-07-20T16:58:46.748993+00:00` — do not trust full-bar OHLC.
    - **Nested refine leading remainder** `2026-07-20T16:58:46.748993+00:00` -> `2026-07-20T17:00:00+00:00`

      ## Search ladder
      - Ladder: `1m`
      - Prediction window: `2026-07-20T16:58:46.748993+00:00` -> `2026-07-20T17:00:00+00:00`
      - Levels (long): entry=65446.91 target=70859.76 stop=65413.50

      ### Step 1: fetch `1m`
      - Search window: `2026-07-20T16:58:46.748993+00:00` -> `2026-07-20T17:00:00+00:00`
      - Fetch from floored open `2026-07-20T16:58:00+00:00` (covers mid-bucket start)
      - Fetched **3** candle(s) in **402 ms**
        - `1m` open=2026-07-20T16:58:00+00:00  O=65394.99 H=65429.97 L=65380.01 C=65427.80  << LEADING PARTIAL (opens before prediction start)
        - `1m` open=2026-07-20T16:59:00+00:00  O=65427.81 H=65454.02 L=65427.80 C=65454.01
        - `1m` open=2026-07-20T17:00:00+00:00  O=65454.01 H=65488.45 L=65440.00 C=65468.26
      - **No level touch on coarse full window** -> expire early (no finer fetches).

    - Leading remainder clean — **resume** later candles at this interval.
    - **First interesting candle at `15m`:** `2026-07-20T17:00:00+00:00` — STOP hit (65413.50) on low=65385.04
    - **ZOOM into candle** `2026-07-20T17:00:00+00:00` (15m bar, span 0:15:00) -> next fetch `2026-07-20T17:00:00+00:00` -> `2026-07-20T17:00:00+00:00`

    ### Step 2: fetch `1m`
    - Search window: `2026-07-20T17:00:00+00:00` -> `2026-07-20T17:00:00+00:00`
    - Fetch from floored open `2026-07-20T17:00:00+00:00` (covers mid-bucket start)
    - Fetched **1** candle(s) in **1169 ms**
      - `1m` open=2026-07-20T17:00:00+00:00  O=65454.01 H=65488.45 L=65440.00 C=65468.26
    - No hit in this zoomed slice -> try next interval.

  - Leading remainder clean — **resume** later candles at this interval.
  - **First interesting candle at `1h`:** `2026-07-20T17:00:00+00:00` — STOP hit (65413.50) on low=65282.93
  - **ZOOM into candle** `2026-07-20T17:00:00+00:00` (1h bar, span 1:00:00) -> next fetch `2026-07-20T17:00:00+00:00` -> `2026-07-20T17:58:46.748993+00:00`

  ### Step 2: fetch `15m`
  - Search window: `2026-07-20T17:00:00+00:00` -> `2026-07-20T17:58:46.748993+00:00`
  - Fetch from floored open `2026-07-20T17:00:00+00:00` (covers mid-bucket start)
  - Fetched **4** candle(s) in **1166 ms**
    - `15m` open=2026-07-20T17:00:00+00:00  O=65454.01 H=65500.00 L=65385.04 C=65444.40  << INTERESTING (loss)
    - `15m` open=2026-07-20T17:15:00+00:00  O=65444.40 H=65464.52 L=65373.02 C=65452.03  << INTERESTING (loss)
    - `15m` open=2026-07-20T17:30:00+00:00  O=65452.03 H=65459.23 L=65282.93 C=65309.60  << INTERESTING (loss)
    - `15m` open=2026-07-20T17:45:00+00:00  O=65309.60 H=65610.89 L=65309.60 C=65533.52  << INTERESTING (loss)
  - **First interesting candle at `15m`:** `2026-07-20T17:00:00+00:00` — STOP hit (65413.50) on low=65385.04
  - **ZOOM into candle** `2026-07-20T17:00:00+00:00` (15m bar, span 0:15:00) -> next fetch `2026-07-20T17:00:00+00:00` -> `2026-07-20T17:15:00+00:00`

  ### Step 3: fetch `1m`
  - Search window: `2026-07-20T17:00:00+00:00` -> `2026-07-20T17:15:00+00:00`
  - Fetch from floored open `2026-07-20T17:00:00+00:00` (covers mid-bucket start)
  - Fetched **16** candle(s) in **1117 ms**
    - `1m` open=2026-07-20T17:00:00+00:00  O=65454.01 H=65488.45 L=65440.00 C=65468.26
    - `1m` open=2026-07-20T17:01:00+00:00  O=65468.27 H=65483.04 L=65440.69 C=65460.05
    - `1m` open=2026-07-20T17:02:00+00:00  O=65460.04 H=65460.05 L=65396.17 C=65425.47  << INTERESTING (loss)
    - `1m` open=2026-07-20T17:03:00+00:00  O=65425.48 H=65443.08 L=65403.30 C=65408.69  << INTERESTING (loss)
    - `1m` open=2026-07-20T17:04:00+00:00  O=65408.70 H=65417.96 L=65393.48 C=65396.18  << INTERESTING (loss)
    - `1m` open=2026-07-20T17:05:00+00:00  O=65396.17 H=65427.00 L=65385.04 C=65416.03  << INTERESTING (loss)
    - `1m` open=2026-07-20T17:06:00+00:00  O=65414.72 H=65481.59 L=65411.01 C=65456.04  << INTERESTING (loss)
    - `1m` open=2026-07-20T17:07:00+00:00  O=65456.04 H=65477.68 L=65419.76 C=65468.00
    - `1m` open=2026-07-20T17:08:00+00:00  O=65466.13 H=65467.46 L=65411.01 C=65414.38  << INTERESTING (loss)
    - `1m` open=2026-07-20T17:09:00+00:00  O=65414.38 H=65495.83 L=65414.38 C=65477.31
    - `1m` open=2026-07-20T17:10:00+00:00  O=65477.31 H=65486.27 L=65415.60 C=65418.46
    - `1m` open=2026-07-20T17:11:00+00:00  O=65418.47 H=65447.50 L=65415.97 C=65447.50
    - `1m` open=2026-07-20T17:12:00+00:00  O=65447.99 H=65452.00 L=65430.10 C=65438.61
    - `1m` open=2026-07-20T17:13:00+00:00  O=65438.61 H=65500.00 L=65436.86 C=65485.50
    - `1m` open=2026-07-20T17:14:00+00:00  O=65485.51 H=65489.59 L=65444.40 C=65444.40
    - `1m` open=2026-07-20T17:15:00+00:00  O=65444.40 H=65444.41 L=65373.02 C=65393.55  << INTERESTING (loss)
  - **First interesting candle at `1m`:** `2026-07-20T17:02:00+00:00` — STOP hit (65413.50) on low=65396.17
  - Finest interval `1m` — **search result locked** on this candle.

## Final search result
- **outcome:** `loss`
- **hit_price:** `65413.50`
- **hit_at:** `2026-07-20T17:02:00+00:00`
- **return_pct:** `-0.000511`
- **resolution_note:** `None`
- **timings:** fetches=7, candles_scanned=29, fetch_ms=4898, search_ms=4898, by_interval={6h:331ms, 1h:338ms, 15m:1539ms, 1m:2689ms}

### Floor check
- Floored fetch logged: **True**
- Leading partial / leading gap zoom logged: **True**
- hit_at inside prediction window: **True** (`2026-07-20T17:02:00+00:00`)

---

## 1-hour prediction — wide levels (expect expired)

- Duration: **60.0 minutes**
- start=`2026-07-20T16:58:46.748993+00:00` expiry=`2026-07-20T17:58:46.748993+00:00`
- floor(`6h`)=`2026-07-20T12:00:00+00:00`
- floor(`1h`)=`2026-07-20T16:00:00+00:00`
- Minutes after floored 6h open until prediction start: **~299 min**

## Search ladder
- Ladder: `6h -> 1h -> 15m -> 1m`
- Prediction window: `2026-07-20T16:58:46.748993+00:00` -> `2026-07-20T17:58:46.748993+00:00`
- Levels (long): entry=65446.91 target=81808.64 stop=49085.18

### Step 1: fetch `6h`
- Search window: `2026-07-20T16:58:46.748993+00:00` -> `2026-07-20T17:58:46.748993+00:00`
- Fetch from floored open `2026-07-20T12:00:00+00:00` (covers mid-bucket start)
- Fetched **1** candle(s) in **340 ms**
  - `6h` open=2026-07-20T12:00:00+00:00  O=64944.01 H=65626.04 L=64010.00 C=65533.52  << LEADING PARTIAL (opens before prediction start)
- **LEADING GAP:** bar opened `2026-07-20T12:00:00+00:00` but prediction starts `2026-07-20T16:58:46.748993+00:00` — do not trust full-bar OHLC.
- **Nested refine leading remainder** `2026-07-20T16:58:46.748993+00:00` -> `2026-07-20T17:58:46.748993+00:00`

  ## Search ladder
  - Ladder: `1h -> 15m -> 1m`
  - Prediction window: `2026-07-20T16:58:46.748993+00:00` -> `2026-07-20T17:58:46.748993+00:00`
  - Levels (long): entry=65446.91 target=81808.64 stop=49085.18

  ### Step 1: fetch `1h`
  - Search window: `2026-07-20T16:58:46.748993+00:00` -> `2026-07-20T17:58:46.748993+00:00`
  - Fetch from floored open `2026-07-20T16:00:00+00:00` (covers mid-bucket start)
  - Fetched **2** candle(s) in **354 ms**
    - `1h` open=2026-07-20T16:00:00+00:00  O=65550.00 H=65592.82 L=65283.63 C=65454.01  << LEADING PARTIAL (opens before prediction start)
    - `1h` open=2026-07-20T17:00:00+00:00  O=65454.01 H=65610.89 L=65282.93 C=65533.52
  - **LEADING GAP:** bar opened `2026-07-20T16:00:00+00:00` but prediction starts `2026-07-20T16:58:46.748993+00:00` — do not trust full-bar OHLC.
  - **Nested refine leading remainder** `2026-07-20T16:58:46.748993+00:00` -> `2026-07-20T17:00:00+00:00`

    ## Search ladder
    - Ladder: `15m -> 1m`
    - Prediction window: `2026-07-20T16:58:46.748993+00:00` -> `2026-07-20T17:00:00+00:00`
    - Levels (long): entry=65446.91 target=81808.64 stop=49085.18

    ### Step 1: fetch `15m`
    - Search window: `2026-07-20T16:58:46.748993+00:00` -> `2026-07-20T17:00:00+00:00`
    - Fetch from floored open `2026-07-20T16:45:00+00:00` (covers mid-bucket start)
    - Fetched **2** candle(s) in **330 ms**
      - `15m` open=2026-07-20T16:45:00+00:00  O=65327.94 H=65464.30 L=65311.00 C=65454.01  << LEADING PARTIAL (opens before prediction start)
      - `15m` open=2026-07-20T17:00:00+00:00  O=65454.01 H=65500.00 L=65385.04 C=65444.40
    - **LEADING GAP:** bar opened `2026-07-20T16:45:00+00:00` but prediction starts `2026-07-20T16:58:46.748993+00:00` — do not trust full-bar OHLC.
    - **Nested refine leading remainder** `2026-07-20T16:58:46.748993+00:00` -> `2026-07-20T17:00:00+00:00`

      ## Search ladder
      - Ladder: `1m`
      - Prediction window: `2026-07-20T16:58:46.748993+00:00` -> `2026-07-20T17:00:00+00:00`
      - Levels (long): entry=65446.91 target=81808.64 stop=49085.18

      ### Step 1: fetch `1m`
      - Search window: `2026-07-20T16:58:46.748993+00:00` -> `2026-07-20T17:00:00+00:00`
      - Fetch from floored open `2026-07-20T16:58:00+00:00` (covers mid-bucket start)
      - Fetched **3** candle(s) in **323 ms**
        - `1m` open=2026-07-20T16:58:00+00:00  O=65394.99 H=65429.97 L=65380.01 C=65427.80  << LEADING PARTIAL (opens before prediction start)
        - `1m` open=2026-07-20T16:59:00+00:00  O=65427.81 H=65454.02 L=65427.80 C=65454.01
        - `1m` open=2026-07-20T17:00:00+00:00  O=65454.01 H=65488.45 L=65440.00 C=65468.26
      - **No level touch on coarse full window** -> expire early (no finer fetches).

    - Leading remainder clean — **resume** later candles at this interval.
    - No further hits after leading remainder.

    ### Step 2: fetch `1m`
    - Search window: `2026-07-20T16:58:46.748993+00:00` -> `2026-07-20T17:00:00+00:00`
    - Fetch from floored open `2026-07-20T16:58:00+00:00` (covers mid-bucket start)
    - Fetched **3** candle(s) in **340 ms**
      - `1m` open=2026-07-20T16:58:00+00:00  O=65394.99 H=65429.97 L=65380.01 C=65427.80  << LEADING PARTIAL (opens before prediction start)
      - `1m` open=2026-07-20T16:59:00+00:00  O=65427.81 H=65454.02 L=65427.80 C=65454.01
      - `1m` open=2026-07-20T17:00:00+00:00  O=65454.01 H=65488.45 L=65440.00 C=65468.26
    - No hit in this zoomed slice -> try next interval.

  - Leading remainder clean — **resume** later candles at this interval.
  - No further hits after leading remainder.

  ### Step 2: fetch `15m`
  - Search window: `2026-07-20T16:58:46.748993+00:00` -> `2026-07-20T17:58:46.748993+00:00`
  - Fetch from floored open `2026-07-20T16:45:00+00:00` (covers mid-bucket start)
  - Fetched **5** candle(s) in **1127 ms**
    - `15m` open=2026-07-20T16:45:00+00:00  O=65327.94 H=65464.30 L=65311.00 C=65454.01  << LEADING PARTIAL (opens before prediction start)
    - `15m` open=2026-07-20T17:00:00+00:00  O=65454.01 H=65500.00 L=65385.04 C=65444.40
    - `15m` open=2026-07-20T17:15:00+00:00  O=65444.40 H=65464.52 L=65373.02 C=65452.03
    - `15m` open=2026-07-20T17:30:00+00:00  O=65452.03 H=65459.23 L=65282.93 C=65309.60
    - `15m` open=2026-07-20T17:45:00+00:00  O=65309.60 H=65610.89 L=65309.60 C=65533.52
  - **LEADING GAP:** bar opened `2026-07-20T16:45:00+00:00` but prediction starts `2026-07-20T16:58:46.748993+00:00` — do not trust full-bar OHLC.
  - **Nested refine leading remainder** `2026-07-20T16:58:46.748993+00:00` -> `2026-07-20T17:00:00+00:00`

    ## Search ladder
    - Ladder: `1m`
    - Prediction window: `2026-07-20T16:58:46.748993+00:00` -> `2026-07-20T17:00:00+00:00`
    - Levels (long): entry=65446.91 target=81808.64 stop=49085.18

    ### Step 1: fetch `1m`
    - Search window: `2026-07-20T16:58:46.748993+00:00` -> `2026-07-20T17:00:00+00:00`
    - Fetch from floored open `2026-07-20T16:58:00+00:00` (covers mid-bucket start)
    - Fetched **3** candle(s) in **386 ms**
      - `1m` open=2026-07-20T16:58:00+00:00  O=65394.99 H=65429.97 L=65380.01 C=65427.80  << LEADING PARTIAL (opens before prediction start)
      - `1m` open=2026-07-20T16:59:00+00:00  O=65427.81 H=65454.02 L=65427.80 C=65454.01
      - `1m` open=2026-07-20T17:00:00+00:00  O=65454.01 H=65488.45 L=65440.00 C=65468.26
    - **No level touch on coarse full window** -> expire early (no finer fetches).

  - Leading remainder clean — **resume** later candles at this interval.
  - No further hits after leading remainder.

  ### Step 3: fetch `1m`
  - Search window: `2026-07-20T16:58:46.748993+00:00` -> `2026-07-20T17:58:46.748993+00:00`
  - Fetch from floored open `2026-07-20T16:58:00+00:00` (covers mid-bucket start)
  - Fetched **61** candle(s) in **374 ms**
    - `1m` open=2026-07-20T16:58:00+00:00  O=65394.99 H=65429.97 L=65380.01 C=65427.80  << LEADING PARTIAL (opens before prediction start)
    - `1m` open=2026-07-20T16:59:00+00:00  O=65427.81 H=65454.02 L=65427.80 C=65454.01
    - `1m` open=2026-07-20T17:00:00+00:00  O=65454.01 H=65488.45 L=65440.00 C=65468.26
    - `1m` open=2026-07-20T17:01:00+00:00  O=65468.27 H=65483.04 L=65440.69 C=65460.05
    - `1m` open=2026-07-20T17:02:00+00:00  O=65460.04 H=65460.05 L=65396.17 C=65425.47
    - `1m` open=2026-07-20T17:03:00+00:00  O=65425.48 H=65443.08 L=65403.30 C=65408.69
    - `1m` open=2026-07-20T17:04:00+00:00  O=65408.70 H=65417.96 L=65393.48 C=65396.18
    - `1m` open=2026-07-20T17:05:00+00:00  O=65396.17 H=65427.00 L=65385.04 C=65416.03
    - `1m` open=2026-07-20T17:06:00+00:00  O=65414.72 H=65481.59 L=65411.01 C=65456.04
    - `1m` open=2026-07-20T17:07:00+00:00  O=65456.04 H=65477.68 L=65419.76 C=65468.00
    - `1m` open=2026-07-20T17:08:00+00:00  O=65466.13 H=65467.46 L=65411.01 C=65414.38
    - `1m` open=2026-07-20T17:09:00+00:00  O=65414.38 H=65495.83 L=65414.38 C=65477.31
    - `1m` open=2026-07-20T17:10:00+00:00  O=65477.31 H=65486.27 L=65415.60 C=65418.46
    - `1m` open=2026-07-20T17:11:00+00:00  O=65418.47 H=65447.50 L=65415.97 C=65447.50
    - `1m` open=2026-07-20T17:12:00+00:00  O=65447.99 H=65452.00 L=65430.10 C=65438.61
    - `1m` open=2026-07-20T17:13:00+00:00  O=65438.61 H=65500.00 L=65436.86 C=65485.50
    - `1m` open=2026-07-20T17:14:00+00:00  O=65485.51 H=65489.59 L=65444.40 C=65444.40
    - `1m` open=2026-07-20T17:15:00+00:00  O=65444.40 H=65444.41 L=65373.02 C=65393.55
    - `1m` open=2026-07-20T17:16:00+00:00  O=65393.55 H=65403.19 L=65377.63 C=65403.19
    - `1m` open=2026-07-20T17:17:00+00:00  O=65403.19 H=65440.49 L=65403.18 C=65440.48
    - `1m` open=2026-07-20T17:18:00+00:00  O=65440.49 H=65440.49 L=65415.02 C=65429.55
    - `1m` open=2026-07-20T17:19:00+00:00  O=65429.56 H=65440.00 L=65407.31 C=65432.33
    - `1m` open=2026-07-20T17:20:00+00:00  O=65432.33 H=65439.63 L=65415.57 C=65428.55
    - `1m` open=2026-07-20T17:21:00+00:00  O=65428.56 H=65459.23 L=65428.55 C=65451.25
    - `1m` open=2026-07-20T17:22:00+00:00  O=65451.24 H=65464.52 L=65440.70 C=65444.64
    - `1m` open=2026-07-20T17:23:00+00:00  O=65440.70 H=65440.70 L=65403.59 C=65431.42
    - `1m` open=2026-07-20T17:24:00+00:00  O=65431.42 H=65431.43 L=65403.69 C=65422.14
    - `1m` open=2026-07-20T17:25:00+00:00  O=65422.13 H=65446.40 L=65413.08 C=65428.73
    - `1m` open=2026-07-20T17:26:00+00:00  O=65428.74 H=65464.48 L=65421.58 C=65464.48
    - `1m` open=2026-07-20T17:27:00+00:00  O=65464.48 H=65464.48 L=65414.99 C=65419.79
    - `1m` open=2026-07-20T17:28:00+00:00  O=65422.15 H=65449.42 L=65422.15 C=65437.55
    - `1m` open=2026-07-20T17:29:00+00:00  O=65437.55 H=65453.35 L=65429.99 C=65452.03
    - `1m` open=2026-07-20T17:30:00+00:00  O=65452.03 H=65459.23 L=65411.01 C=65418.36
    - `1m` open=2026-07-20T17:31:00+00:00  O=65418.36 H=65418.37 L=65404.26 C=65409.61
    - `1m` open=2026-07-20T17:32:00+00:00  O=65411.18 H=65436.98 L=65392.46 C=65404.76
    - `1m` open=2026-07-20T17:33:00+00:00  O=65404.75 H=65415.99 L=65392.46 C=65395.36
    - `1m` open=2026-07-20T17:34:00+00:00  O=65395.36 H=65407.29 L=65373.91 C=65373.91
    - `1m` open=2026-07-20T17:35:00+00:00  O=65373.91 H=65373.92 L=65352.72 C=65367.85
    - `1m` open=2026-07-20T17:36:00+00:00  O=65366.49 H=65374.84 L=65344.01 C=65363.09
    - `1m` open=2026-07-20T17:37:00+00:00  O=65363.10 H=65399.88 L=65363.10 C=65388.36
    - `1m` open=2026-07-20T17:38:00+00:00  O=65388.36 H=65396.16 L=65370.77 C=65373.66
    - `1m` open=2026-07-20T17:39:00+00:00  O=65373.65 H=65381.71 L=65350.14 C=65350.15
    - `1m` open=2026-07-20T17:40:00+00:00  O=65350.14 H=65354.18 L=65324.00 C=65329.12
    - `1m` open=2026-07-20T17:41:00+00:00  O=65329.13 H=65339.82 L=65325.88 C=65339.82
    - `1m` open=2026-07-20T17:42:00+00:00  O=65339.82 H=65358.64 L=65330.00 C=65340.50
    - `1m` open=2026-07-20T17:43:00+00:00  O=65340.50 H=65352.95 L=65321.52 C=65321.52
    - `1m` open=2026-07-20T17:44:00+00:00  O=65321.52 H=65332.37 L=65282.93 C=65309.60
    - `1m` open=2026-07-20T17:45:00+00:00  O=65309.60 H=65369.99 L=65309.60 C=65369.99
    - `1m` open=2026-07-20T17:46:00+00:00  O=65369.99 H=65372.80 L=65344.23 C=65351.65
    - `1m` open=2026-07-20T17:47:00+00:00  O=65351.65 H=65369.51 L=65351.65 C=65369.51
    - `1m` open=2026-07-20T17:48:00+00:00  O=65369.51 H=65400.29 L=65348.85 C=65400.28
    - `1m` open=2026-07-20T17:49:00+00:00  O=65400.28 H=65427.36 L=65385.04 C=65427.36
    - `1m` open=2026-07-20T17:50:00+00:00  O=65427.36 H=65430.33 L=65410.22 C=65419.47
    - `1m` open=2026-07-20T17:51:00+00:00  O=65419.47 H=65464.30 L=65409.71 C=65455.54
    - `1m` open=2026-07-20T17:52:00+00:00  O=65455.53 H=65500.00 L=65455.53 C=65457.08
    - `1m` open=2026-07-20T17:53:00+00:00  O=65457.08 H=65483.81 L=65450.53 C=65467.49
    - `1m` open=2026-07-20T17:54:00+00:00  O=65462.95 H=65610.89 L=65458.00 C=65527.08
    - `1m` open=2026-07-20T17:55:00+00:00  O=65527.09 H=65527.09 L=65496.48 C=65507.83
    - `1m` open=2026-07-20T17:56:00+00:00  O=65507.83 H=65531.12 L=65501.85 C=65503.76
    - `1m` open=2026-07-20T17:57:00+00:00  O=65503.76 H=65597.08 L=65501.29 C=65559.41
    - `1m` open=2026-07-20T17:58:00+00:00  O=65559.41 H=65569.49 L=65533.51 C=65540.91
  - No hit in this zoomed slice -> try next interval.

## Final search result
- **outcome:** `expired`
- **hit_price:** `65540.91`
- **hit_at:** `null`
- **return_pct:** `0.001436`
- **resolution_note:** `neither_level_hit`
- **timings:** fetches=8, candles_scanned=80, fetch_ms=3574, search_ms=3575, by_interval={6h:340ms, 1h:354ms, 15m:1456ms, 1m:1423ms}

### Floor check
- Floored fetch logged: **True**
- Leading partial / leading gap zoom logged: **True**
- hit_at: `null` (expired path)

---
