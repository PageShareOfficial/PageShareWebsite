"""Tests for admin moderation of the reports queue."""

from datetime import datetime, timezone
from unittest.mock import MagicMock
from uuid import uuid4
import pytest
from app.models.comment import Comment
from app.models.post import Post
from app.models.report import Report
from app.models.user import User
from app.services.admin_report_service import (
    CONTENT_PREVIEW_MAX_LENGTH,
    ContentRemovalNotSupportedError,
    InvalidReportStatusError,
    build_admin_report_item,
    remove_reported_content,
    update_report_status,
)

NOW = datetime(2026, 10, 12, tzinfo=timezone.utc)

def _db_with_rows(*rows):
    """MagicMock session whose db.get(Model, id) returns the matching row by id."""
    by_id = {row.id: row for row in rows}
    db = MagicMock()
    db.get.side_effect = lambda _model, row_id: by_id.get(row_id)
    db.query.return_value.filter.return_value.filter.return_value.all.return_value = []
    return db

def _report(**target):
    return Report(
        id=uuid4(),
        reporter_id=uuid4(),
        report_type="spam",
        reason="looks like spam",
        status="pending",
        created_at=NOW,
        **target,
    )

def test_build_item_for_post_report_includes_preview_and_author():
    author = User(id=uuid4(), username="author", display_name="A")
    post = Post(id=uuid4(), user_id=author.id, content="x" * 400, deleted_at=None)
    report = _report(reported_post_id=post.id)
    reporter = User(id=report.reporter_id, username="reporter", display_name="R")
    item = build_admin_report_item(_db_with_rows(author, post, reporter), report)

    assert item.content_type == "post"
    assert item.post_id == str(post.id)
    assert item.target_username == "author"
    assert item.reporter_username == "reporter"
    assert item.content_deleted is False
    assert len(item.content_preview) == CONTENT_PREVIEW_MAX_LENGTH + 1

def test_build_item_for_comment_report_links_parent_post():
    comment = Comment(
        id=uuid4(), post_id=uuid4(), user_id=uuid4(), content="rude", deleted_at=NOW
    )
    report = _report(reported_comment_id=comment.id)
    item = build_admin_report_item(_db_with_rows(comment), report)

    assert item.content_type == "comment"
    assert item.post_id == str(comment.post_id)
    assert item.content_preview == "rude"
    assert item.content_deleted is True

def test_build_item_for_user_report():
    target = User(id=uuid4(), username="target", display_name="T")
    item = build_admin_report_item(_db_with_rows(target), _report(reported_user_id=target.id))

    assert item.content_type == "user"
    assert item.target_username == "target"
    assert item.content_preview is None

def test_update_report_status_records_reviewer():
    report = _report(reported_post_id=uuid4())
    admin_id = uuid4()
    updated = update_report_status(_db_with_rows(report), report.id, "dismissed", admin_id)

    assert updated.status == "dismissed"
    assert updated.reviewed_by == admin_id
    assert updated.reviewed_at is not None

def test_update_report_status_returns_none_for_unknown_report():
    assert update_report_status(_db_with_rows(), uuid4(), "resolved", uuid4()) is None

@pytest.mark.parametrize("bad_status", ["pending", "deleted", ""])
def test_update_report_status_rejects_unsupported_status(bad_status):
    db = _db_with_rows()
    with pytest.raises(InvalidReportStatusError):
        update_report_status(db, uuid4(), bad_status, uuid4())
    db.commit.assert_not_called()

def test_remove_reported_post_soft_deletes_and_resolves():
    post = Post(id=uuid4(), user_id=uuid4(), content="bad", deleted_at=None)
    report = _report(reported_post_id=post.id)
    db = _db_with_rows(post, report)
    removed = remove_reported_content(db, report.id, uuid4())

    assert post.deleted_at is not None
    assert removed.status == "resolved"
    db.commit.assert_called_once()

def test_remove_content_resolves_other_pending_reports_on_same_post():
    post = Post(id=uuid4(), user_id=uuid4(), content="bad", deleted_at=None)
    report = _report(reported_post_id=post.id)
    sibling = _report(reported_post_id=post.id)
    db = _db_with_rows(post, report)
    db.query.return_value.filter.return_value.filter.return_value.all.return_value = [sibling]
    admin_id = uuid4()
    remove_reported_content(db, report.id, admin_id)

    assert sibling.status == "resolved"
    assert sibling.reviewed_by == admin_id

def test_remove_content_returns_none_for_unknown_report():
    assert remove_reported_content(_db_with_rows(), uuid4(), uuid4()) is None

def test_remove_reported_comment_soft_deletes():
    comment = Comment(
        id=uuid4(), post_id=uuid4(), user_id=uuid4(), content="bad", deleted_at=None
    )
    report = _report(reported_comment_id=comment.id)
    remove_reported_content(_db_with_rows(comment, report), report.id, uuid4())

    assert comment.deleted_at is not None

def test_remove_content_rejects_user_reports():
    report = _report(reported_user_id=uuid4())
    with pytest.raises(ContentRemovalNotSupportedError):
        remove_reported_content(_db_with_rows(report), report.id, uuid4())
