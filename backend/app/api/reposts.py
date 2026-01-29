"""
Repost endpoints: create (normal/quote), delete.
"""
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import get_current_user
from app.schemas.repost import (
    CreateRepostRequest,
    OriginalPostAuthor,
    OriginalPostSummary,
    RepostResponse,
)
from app.services.auth_service import CurrentUser
from app.services.post_service import get_post_by_id
from app.services.repost_service import (
    create_normal_repost,
    create_quote_repost,
    delete_repost,
)

router = APIRouter(tags=["reposts"])

@router.post("/posts/{post_id}/reposts", response_model=RepostResponse, status_code=status.HTTP_201_CREATED)
def create_repost_endpoint(
    post_id: str,
    body: CreateRepostRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Create a repost (normal or quote). 409 if already reposted."""
    try:
        pid = UUID(post_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Post not found")
    post = get_post_by_id(db, pid)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if body.type not in ("normal", "quote"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="type must be 'normal' or 'quote'",
        )
    user_id = UUID(current_user.auth_user_id)
    try:
        if body.type == "normal":
            repost = create_normal_repost(db, user_id, pid)
            from app.models.user import User
            original_author = db.get(User, post.user_id)
            return RepostResponse(
                id=str(repost.id),
                type="normal",
                original_post=OriginalPostSummary(
                    id=str(post.id),
                    author=OriginalPostAuthor(
                        username=original_author.username,
                        display_name=original_author.display_name,
                    ),
                    content=post.content,
                ),
                quote_content=None,
                created_at=repost.created_at,
            )
        repost, quote_post = create_quote_repost(
            db,
            user_id,
            pid,
            quote_content=body.quote_content or "",
            media_urls=body.media_urls,
            gif_url=body.gif_url,
        )
        from app.models.user import User
        original_author = db.get(User, post.user_id)
        return RepostResponse(
            id=str(repost.id),
            type="quote",
            original_post=OriginalPostSummary(
                id=str(post.id),
                author=OriginalPostAuthor(
                    username=original_author.username,
                    display_name=original_author.display_name,
                ),
                content=post.content,
            ),
            quote_content=repost.quote_content,
            created_at=repost.created_at,
        )
    except ValueError as e:
        if "Already reposted" in str(e):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already reposted")
        if "Quote repost requires" in str(e):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=str(e),
            )
        raise

@router.delete("/posts/{post_id}/reposts", status_code=status.HTTP_204_NO_CONTENT)
def delete_repost_endpoint(
    post_id: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Remove a repost (undo repost)."""
    try:
        pid = UUID(post_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Post not found")
    ok = delete_repost(db, UUID(current_user.auth_user_id), pid)
    if not ok:
        raise HTTPException(status_code=404, detail="Repost not found")
    # 204 No Content
