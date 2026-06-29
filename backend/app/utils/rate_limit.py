"""Simple in-process rate limiting for sensitive endpoints."""

from collections import defaultdict
from threading import Lock
from time import time

_lock = Lock()
_attempts: dict[str, list[float]] = defaultdict(list)

DEFAULT_WINDOW_SECONDS = 60
DEFAULT_MAX_REQUESTS = 10

def is_rate_limited(
    key: str,
    *,
    window_seconds: int = DEFAULT_WINDOW_SECONDS,
    max_requests: int = DEFAULT_MAX_REQUESTS,
) -> bool:
    """Return True when the key has exceeded the allowed request count."""
    now = time()
    with _lock:
        recent = [ts for ts in _attempts[key] if now - ts < window_seconds]
        if len(recent) >= max_requests:
            _attempts[key] = recent
            return True
        recent.append(now)
        _attempts[key] = recent
        return False
