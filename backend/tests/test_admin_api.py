"""HTTP-level tests for the admin moderation router (auth guard, status codes, validation)."""

from datetime import datetime, timezone
from unittest.mock import MagicMock, patch
from uuid import uuid4
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.api.admin import router
from app.database import get_db
from app.middleware.auth import get_current_user, require_admin
from app.models.user import User
from app.schemas.admin import AdminReportItem
from app.services.admin_report_service import ContentRemovalNotSupportedError
from app.services.auth_service import CurrentUser

ADMIN_ID = uuid4()
REPORT_ID = uuid4()

def _current_user() -> CurrentUser:
    return CurrentUser(auth_user_id=str(ADMIN_ID), claims={})

def _report_item() -> AdminReportItem:
    return AdminReportItem(
        id=str(REPORT_ID),
        status="resolved",
        report_type="spam",
        created_at=datetime(2026, 10, 12, tzinfo=timezone.utc),
        content_type="post",
    )

def _client(*, as_admin: bool, badge: str | None = None) -> TestClient:
    app = FastAPI()
    app.include_router(router, prefix="/api/v1")
    db = MagicMock()
    db.get.return_value = User(id=ADMIN_ID, username="someone", display_name="S", badge=badge)
    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_current_user] = _current_user
    if as_admin:
        app.dependency_overrides[require_admin] = _current_user
    return TestClient(app)

def test_non_admin_is_forbidden():
    response = _client(as_admin=False, badge="Verified").get("/api/v1/admin/reports")
    assert response.status_code == 403

def test_list_reports_returns_paginated_shape():
    with patch("app.api.admin.list_reports", return_value=([], 0)) as mock_list:
        response = _client(as_admin=True).get("/api/v1/admin/reports?status=pending")
    assert response.status_code == 200
    assert response.json()["pagination"]["total"] == 0
    assert mock_list.call_args.kwargs["status"] == "pending"

def test_list_reports_rejects_unknown_status_filter():
    response = _client(as_admin=True).get("/api/v1/admin/reports?status=bogus")
    assert response.status_code == 422

@pytest.mark.parametrize("body_status", ["pending", "nope"])
def test_update_status_rejects_invalid_body(body_status):
    response = _client(as_admin=True).patch(
        f"/api/v1/admin/reports/{REPORT_ID}", json={"status": body_status}
    )
    assert response.status_code == 422

def test_update_status_unknown_report_is_404():
    with patch("app.api.admin.update_report_status", return_value=None):
        response = _client(as_admin=True).patch(
            f"/api/v1/admin/reports/{REPORT_ID}", json={"status": "dismissed"}
        )
    assert response.status_code == 404

def test_update_status_malformed_id_is_404():
    response = _client(as_admin=True).patch(
        "/api/v1/admin/reports/not-a-uuid", json={"status": "dismissed"}
    )
    assert response.status_code == 404

def test_remove_content_success():
    with patch("app.api.admin.remove_reported_content", return_value=MagicMock()), patch(
        "app.api.admin.build_admin_report_item", return_value=_report_item()
    ):
        response = _client(as_admin=True).post(
            f"/api/v1/admin/reports/{REPORT_ID}/remove-content"
        )
    assert response.status_code == 200
    assert response.json()["data"]["status"] == "resolved"

def test_remove_content_for_user_report_is_422():
    with patch(
        "app.api.admin.remove_reported_content",
        side_effect=ContentRemovalNotSupportedError("User reports cannot be removed."),
    ):
        response = _client(as_admin=True).post(
            f"/api/v1/admin/reports/{REPORT_ID}/remove-content"
        )
    assert response.status_code == 422
