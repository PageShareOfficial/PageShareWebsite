from typing import Any, Dict
from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from app.services.auth_service import AuthException

def _error_body(code: str, message: str, details: Dict[str, Any] | None = None) -> Dict[str, Any]:
    return {
        "error": {
            "code": code,
            "message": message,
            "details": details or {},
        }
    }

def init_error_handlers(app: FastAPI) -> None:
    """
    Register global exception handlers so all errors share a consistent shape.
    """

    @app.exception_handler(AuthException)
    async def auth_exception_handler(_: Request, exc: AuthException) -> JSONResponse:
        status_code = 401
        if exc.code == "AUTH_REQUIRED":
            status_code = 401
        elif exc.code in {"AUTH_INVALID", "AUTH_MALFORMED"}:
            status_code = 401

        return JSONResponse(
            status_code=status_code,
            content=_error_body(exc.code, exc.message),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        _: Request, exc: RequestValidationError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=422,
            content=_error_body(
                "VALIDATION_ERROR",
                "Request validation failed",
                {"errors": exc.errors()},
            ),
        )

    @app.exception_handler(HTTPException)
    async def http_exception_handler(_: Request, exc: HTTPException) -> JSONResponse:
        # Preserve status_code but normalize body to our error format.
        code = "INTERNAL_ERROR"
        if exc.status_code == 401:
            code = "AUTH_REQUIRED"
        elif exc.status_code == 403:
            code = "PERMISSION_DENIED"
        elif exc.status_code == 404:
            code = "NOT_FOUND"
        elif exc.status_code == 422:
            code = "VALIDATION_ERROR"

        message = exc.detail if isinstance(exc.detail, str) else "Request failed"
        return JSONResponse(
            status_code=exc.status_code,
            content=_error_body(code, message),
        )
