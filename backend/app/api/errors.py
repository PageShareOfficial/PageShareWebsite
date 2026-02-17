"""
Error tracking endpoints: POST /errors/log, GET /errors, PATCH /errors/{error_id}/resolve.
"""
from datetime import date
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import get_current_user, require_admin
from app.schemas.error import (
    ErrorLogResponse,
    LogErrorRequest,
    LogErrorResponse,
    ResolveErrorResponse,
    VALID_ERROR_TYPES,
    VALID_SEVERITIES,
)
from app.services.auth_service import CurrentUser
from app.services.error_service import create_error_log, list_error_logs, resolve_error_log
from app.utils.responses import paginated_response

router = APIRouter(prefix="/errors", tags=["errors"])

@router.post("/log", response_model=dict, status_code=status.HTTP_201_CREATED)
def log_error_endpoint(
    body: LogErrorRequest,
    db: Session = Depends(get_db),
):
    """
    Log a frontend/client error. No auth required so unauthenticated users can report errors.
    """
    if body.error_type not in VALID_ERROR_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"error_type must be one of: {', '.join(VALID_ERROR_TYPES)}",
        )
    if body.severity not in VALID_SEVERITIES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"severity must be one of: {', '.join(VALID_SEVERITIES)}",
        )
    user_id = None
    if body.user_id:
        try:
            user_id = UUID(body.user_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="user_id must be a valid UUID",
            )
    row = create_error_log(
        db,
        error_type=body.error_type,
        error_message=body.error_message,
        error_code=body.error_code,
        stack_trace=body.stack_trace,
        user_id=user_id,
        request_path=body.page_url,
        request_method=None,
        request_id=None,
        user_agent=body.user_agent,
        ip_address_hash=None,
        environment=None,
        severity=body.severity,
        metadata=body.metadata,
        also_send_to_sentry=True,
    )
    return {
        "data": LogErrorResponse(error_id=str(row.id), logged_at=row.created_at),
    }

@router.get("", response_model=dict)
def list_errors_endpoint(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_admin),
    severity: str | None = Query(None, description="Filter by severity"),
    error_type: str | None = Query(None, description="Filter by error_type"),
    resolved: bool | None = Query(None, description="Filter by resolved"),
    date_from: date | None = Query(None, description="From date (inclusive)"),
    date_to: date | None = Query(None, description="To date (inclusive)"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    """Get paginated error logs. Admin only (user.badge == 'admin')."""
    rows, total = list_error_logs(
        db,
        severity=severity,
        error_type=error_type,
        resolved=resolved,
        date_from=date_from,
        date_to=date_to,
        page=page,
        per_page=per_page,
    )
    data = [
        ErrorLogResponse(
            id=str(r.id),
            error_type=r.error_type,
            error_code=r.error_code,
            error_message=r.error_message,
            severity=r.severity,
            user_id=str(r.user_id) if r.user_id else None,
            request_path=r.request_path,
            resolved=r.resolved,
            resolved_at=r.resolved_at,
            created_at=r.created_at,
        )
        for r in rows
    ]
    return paginated_response(data, page, per_page, total)

@router.patch("/{error_id}/resolve", response_model=dict)
def resolve_error_endpoint(
    error_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_admin),
):
    """Mark an error log as resolved. Admin only (user.badge == 'admin')."""
    resolved_by = UUID(current_user.auth_user_id)
    row = resolve_error_log(db, error_id, resolved_by)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Error log not found")
    return {
        "data": ResolveErrorResponse(
            id=str(row.id),
            resolved=row.resolved,
            resolved_at=row.resolved_at,
        ),
    }
