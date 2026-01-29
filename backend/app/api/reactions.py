"""
Reaction (like) endpoints: toggle on post, toggle on comment.
"""
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import get_current_user
from app.schemas.reaction import ToggleReactionResponse
from app.services.auth_service import CurrentUser
from app.services.comment_service import get_comment_by_id
from app.services.post_service import get_post_by_id
from app.services.reaction_service import toggle_comment_reaction, toggle_post_reaction

router = APIRouter(tags=["reactions"])

@router.post("/posts/{post_id}/reactions", response_model=ToggleReactionResponse)
def toggle_post_reaction_endpoint(
    post_id: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Toggle like on a post."""
    try:
        pid = UUID(post_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Post not found")
    if not get_post_by_id(db, pid):
        raise HTTPException(status_code=404, detail="Post not found")
    reacted, count = toggle_post_reaction(db, UUID(current_user.auth_user_id), pid)
    return ToggleReactionResponse(reacted=reacted, reaction_count=count)

@router.post("/comments/{comment_id}/reactions", response_model=ToggleReactionResponse)
def toggle_comment_reaction_endpoint(
    comment_id: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Toggle like on a comment."""
    try:
        cid = UUID(comment_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Comment not found")
    if not get_comment_by_id(db, cid):
        raise HTTPException(status_code=404, detail="Comment not found")
    reacted, count = toggle_comment_reaction(db, UUID(current_user.auth_user_id), cid)
    return ToggleReactionResponse(reacted=reacted, reaction_count=count)
