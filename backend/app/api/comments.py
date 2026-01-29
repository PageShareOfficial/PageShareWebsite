"""
Comment endpoints: create on post, list by post, delete by id.
"""
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import get_current_user, get_optional_user
from app.schemas.comment import CommentAuthor, CommentResponse, CreateCommentRequest
from app.services.auth_service import CurrentUser
from app.services.comment_service import (
    create_comment,
    delete_comment,
    get_comment_by_id,
    get_reaction_counts_for_comments,
    get_user_liked_comments,
    list_comments,
)
from app.services.post_service import get_post_by_id

router = APIRouter(tags=["comments"])

@router.post("/posts/{post_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def create_comment_endpoint(
    post_id: str,
    body: CreateCommentRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Create a comment on a post."""
    if not body.content.strip() and not body.media_urls and not body.gif_url:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Content, media_urls, or gif_url required",
        )
    try:
        pid = UUID(post_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Post not found")
    post = get_post_by_id(db, pid)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    comment = create_comment(
        db,
        post_id=pid,
        user_id=UUID(current_user.auth_user_id),
        content=body.content,
        media_urls=body.media_urls,
        gif_url=body.gif_url,
    )
    from app.models.user import User
    author = db.get(User, comment.user_id)
    return CommentResponse(
        id=str(comment.id),
        post_id=str(comment.post_id),
        author=CommentAuthor(
            id=str(author.id),
            username=author.username,
            display_name=author.display_name,
            profile_picture_url=author.profile_picture_url,
        ),
        content=comment.content,
        media_urls=comment.media_urls,
        gif_url=comment.gif_url,
        likes=0,
        user_liked=False,
        created_at=comment.created_at,
    )

@router.get("/posts/{post_id}/comments", response_model=dict)
def list_comments_endpoint(
    post_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[CurrentUser] = Depends(get_optional_user),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50),
):
    """List comments for a post (paginated)."""
    try:
        pid = UUID(post_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Post not found")
    post = get_post_by_id(db, pid)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    current_id = UUID(current_user.auth_user_id) if current_user else None
    rows, total = list_comments(db, post_id=pid, page=page, per_page=per_page, current_user_id=current_id)
    if not rows:
        return {
            "data": [],
            "pagination": {"page": page, "per_page": per_page, "total": total, "has_next": False},
        }
    comment_ids = [c.id for c, _ in rows]
    like_counts = get_reaction_counts_for_comments(db, comment_ids)
    user_liked = get_user_liked_comments(db, current_id, comment_ids) if current_id else set()
    data = [
        CommentResponse(
            id=str(c.id),
            post_id=str(c.post_id),
            author=CommentAuthor(
                id=str(u.id),
                username=u.username,
                display_name=u.display_name,
                profile_picture_url=u.profile_picture_url,
            ),
            content=c.content,
            media_urls=c.media_urls,
            gif_url=c.gif_url,
            likes=like_counts.get(c.id, 0),
            user_liked=c.id in user_liked,
            created_at=c.created_at,
        )
        for c, u in rows
    ]
    return {
        "data": data,
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "has_next": page * per_page < total,
        },
    }

@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment_endpoint(
    comment_id: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Delete a comment. Only the author can delete."""
    try:
        cid = UUID(comment_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Comment not found")
    ok = delete_comment(db, cid, UUID(current_user.auth_user_id))
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found or you are not the owner",
        )
