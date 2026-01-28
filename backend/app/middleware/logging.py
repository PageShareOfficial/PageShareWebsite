import logging
import time
import uuid
from fastapi import FastAPI, Request
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("pageshare.request")

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Simple request/response logging with request ID and slow-request detection.
    """

    def __init__(self, app: FastAPI, slow_threshold_ms: int = 500) -> None:
        super().__init__(app)
        self.slow_threshold_ms = slow_threshold_ms

    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id

        start = time.perf_counter()
        response = await call_next(request)
        duration_ms = (time.perf_counter() - start) * 1000

        logger.info(
            "%s %s %s %0.2fms",
            request.method,
            request.url.path,
            request_id,
            duration_ms,
        )

        if duration_ms > self.slow_threshold_ms:
            logger.warning(
                "SLOW REQUEST %s %s %s %0.2fms",
                request.method,
                request.url.path,
                request_id,
                duration_ms,
            )

        # Expose request ID to clients if useful
        response.headers["X-Request-ID"] = request_id
        return response


def init_request_logging(app: FastAPI) -> None:
    """
    Attach the request logging middleware.
    """
    app.add_middleware(RequestLoggingMiddleware)
