"""Unit tests for app.utils.responses."""
from app.utils.responses import paginated_response


def test_paginated_response_computes_has_next():
    """When has_next is None, it is computed from page * per_page < total."""
    result = paginated_response([{"id": 1}], page=1, per_page=10, total=5)
    assert result["data"] == [{"id": 1}]
    assert result["pagination"]["page"] == 1
    assert result["pagination"]["per_page"] == 10
    assert result["pagination"]["total"] == 5
    assert result["pagination"]["has_next"] is False


def test_paginated_response_has_next_true_when_more_pages():
    """has_next is True when there are more items."""
    result = paginated_response([], page=1, per_page=10, total=25)
    assert result["pagination"]["has_next"] is True


def test_paginated_response_explicit_has_next():
    """Explicit has_next is respected."""
    result = paginated_response([], page=1, per_page=10, total=100, has_next=False)
    assert result["pagination"]["has_next"] is False
