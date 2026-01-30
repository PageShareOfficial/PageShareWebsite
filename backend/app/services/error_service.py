"""
Error logging service: persist errors to DB and optionally send to Sentry.
"""
from datetime import date, datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple
from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from app.config import get_settings
from app.models.error_log import ErrorLog

settings = get_settings()

def _capture_sentry(
    message: str,
    level: str = "error",
    user_id: Optional[str] = None,
    extra: Optional[Dict[str, Any]] = None,
    exc: Optional[Exception] = None,
) -> None:
    """Send to Sentry if DSN is set."""
    if not settings.sentry_dsn:
        return
    try:
        import sentry_sdk

        if user_id:
            sentry_sdk.set_user({"id": user_id})
        if extra:
            for k, v in extra.items():
                sentry_sdk.set_extra(k, v)
        if exc:
            sentry_sdk.capture_exception(exc)
        else:
            sentry_sdk.capture_message(message, level=level)
    except Exception:
        pass

def create_error_log(
    db: Session,
    *,
    error_type: str,
    error_message: str,
    error_code: Optional[str] = None,
    stack_trace: Optional[str] = None,
    user_id: Optional[UUID] = None,
    request_path: Optional[str] = None,
    request_method: Optional[str] = None,
    request_id: Optional[str] = None,
    user_agent: Optional[str] = None,
    ip_address_hash: Optional[str] = None,
    environment: Optional[str] = None,
    severity: str = "error",
    metadata: Optional[Dict[str, Any]] = None,
    also_send_to_sentry: bool = True,
) -> ErrorLog:
    """Create an error log row and optionally send to Sentry."""
    env = environment or settings.app_env
    if severity not in ("debug", "info", "warning", "error", "critical"):
        severity = "error"

    row = ErrorLog(
        error_type=error_type,
        error_code=error_code,
        error_message=error_message,
        stack_trace=stack_trace,
        user_id=user_id,
        request_path=request_path,
        request_method=request_method,
        request_id=request_id,
        user_agent=user_agent,
        ip_address_hash=ip_address_hash,
        environment=env,
        severity=severity,
        extra_metadata=metadata,
    )
    db.add(row)
    db.commit()
    db.refresh(row)

    if also_send_to_sentry and settings.sentry_dsn:
        extra: Dict[str, Any] = {}
        if request_path:
            extra["request_path"] = request_path
        if request_method:
            extra["request_method"] = request_method
        if request_id:
            extra["request_id"] = request_id
        _capture_sentry(
            error_message,
            level=severity if severity in ("debug", "info", "warning", "error", "critical") else "error",
            user_id=str(user_id) if user_id else None,
            extra=extra or None,
        )

    return row

def list_error_logs(
    db: Session,
    *,
    severity: Optional[str] = None,
    error_type: Optional[str] = None,
    resolved: Optional[bool] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    page: int = 1,
    per_page: int = 20,
) -> Tuple[List[ErrorLog], int]:
    """Return paginated error logs and total count."""
    q = select(ErrorLog)
    count_q = select(func.count()).select_from(ErrorLog)

    if severity:
        q = q.where(ErrorLog.severity == severity)
        count_q = count_q.where(ErrorLog.severity == severity)
    if error_type:
        q = q.where(ErrorLog.error_type == error_type)
        count_q = count_q.where(ErrorLog.error_type == error_type)
    if resolved is not None:
        q = q.where(ErrorLog.resolved == resolved)
        count_q = count_q.where(ErrorLog.resolved == resolved)
    if date_from:
        dt_from = datetime.combine(date_from, datetime.min.time(), tzinfo=timezone.utc)
        q = q.where(ErrorLog.created_at >= dt_from)
        count_q = count_q.where(ErrorLog.created_at >= dt_from)
    if date_to:
        dt_to = datetime.combine(date_to, datetime.min.time(), tzinfo=timezone.utc) + timedelta(days=1)
        q = q.where(ErrorLog.created_at < dt_to)
        count_q = count_q.where(ErrorLog.created_at < dt_to)

    total = db.scalar(count_q) or 0
    q = q.order_by(ErrorLog.created_at.desc()).offset((page - 1) * per_page).limit(per_page)
    rows = list(db.scalars(q).all())
    return rows, total

def resolve_error_log(db: Session, error_id: UUID, resolved_by: UUID) -> Optional[ErrorLog]:
    """Mark error as resolved. Returns updated row or None if not found."""
    row = db.get(ErrorLog, error_id)
    if not row:
        return None
    row.resolved = True
    row.resolved_at = datetime.now(timezone.utc)
    row.resolved_by = resolved_by
    db.commit()
    db.refresh(row)
    return row
