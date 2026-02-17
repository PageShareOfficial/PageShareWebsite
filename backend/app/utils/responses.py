"""
Response helpers for API layer. Single place for pagination shape (DRY).
"""
from typing import Any, List, Optional


def paginated_response(
    data: List[Any],
    page: int,
    per_page: int,
    total: int,
    has_next: Optional[bool] = None,
    has_prev: Optional[bool] = None,
) -> dict:
    """
    Build a standard paginated JSON body: {"data": ..., "pagination": {...}}.
    If has_next is None, it is computed as page * per_page < total.
    If has_prev is None, it is computed as page > 1.
    """
    if has_next is None:
        has_next = page * per_page < total
    if has_prev is None:
        has_prev = page > 1
    return {
        "data": data,
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "has_next": has_next,
            "has_prev": has_prev,
        },
    }
