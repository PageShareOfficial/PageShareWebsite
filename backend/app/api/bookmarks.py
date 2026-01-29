"""
Bookmark endpoints: add/remove bookmark, list user's bookmarks.
"""
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import get_current_user
from app.schemas.bookmark import (
    BookmarkedPostAuthor,
    BookmarkedPostItem,
    BookmarkToggleResponse,
)
from app.services.auth_service import CurrentUser
from app.services.bookmark_service import add_bookmark, list_bookmarks, remove_bookmark
from app.services.post_service import get_post_by_id

router = APIRouter(tags=["bookmarks"])

@router.post("/posts/{post_id}/bookmarks", response_model=dict, status_code=status.HTTP_201_CREATED)
def add_bookmark_endpoint(
    post_id: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Bookmark a post. 409 if already bookmarked."""
    try:
        pid = UUID(post_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Post not found")
    if not get_post_by_id(db, pid):
        raise HTTPException(status_code=404, detail="Post not found")
    try:
        add_bookmark(db, UUID(current_user.auth_user_id), pid)
        return {"data": BookmarkToggleResponse(bookmarked=True)}
    except ValueError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already bookmarked")

@router.delete("/posts/{post_id}/bookmarks", status_code=status.HTTP_204_NO_CONTENT)
def remove_bookmark_endpoint(
    post_id: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Remove bookmark. 404 if bookmark not found."""
    try:
        pid = UUID(post_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Post not found")
    ok = remove_bookmark(db, UUID(current_user.auth_user_id), pid)
    if not ok:
        raise HTTPException(status_code=404, detail="Bookmark not found")

@router.get("/bookmarks", response_model=dict)
def list_bookmarks_endpoint(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50),
):
    """Get current user's bookmarked posts (paginated)."""
    rows, total = list_bookmarks(
        db,
        UUID(current_user.auth_user_id),
        page=page,
        per_page=per_page,
    )
    data = [
        BookmarkedPostItem(
            id=str(post.id),
            author=BookmarkedPostAuthor(
                username=author.username,
                display_name=author.display_name,
            ),
            content=post.content,
            bookmarked_at=bookmarked_at,
        )
        for post, author, bookmarked_at in rows
    ]
    return {
        "data": data,
        "pagination": {"page": page, "per_page": per_page, "total": total},
    }
