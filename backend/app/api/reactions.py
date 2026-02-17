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
from app.utils.http import parse_uuid_or_404

router = APIRouter(tags=["reactions"])

@router.post("/posts/{post_id}/reactions", response_model=ToggleReactionResponse)
def toggle_post_reaction_endpoint(
    post_id: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Toggle like on a post."""
    pid = parse_uuid_or_404(post_id, "Post not found")
    if not get_post_by_id(db, pid):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    reacted, count = toggle_post_reaction(db, UUID(current_user.auth_user_id), pid)
    return ToggleReactionResponse(reacted=reacted, reaction_count=count)

@router.post("/comments/{comment_id}/reactions", response_model=ToggleReactionResponse)
def toggle_comment_reaction_endpoint(
    comment_id: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Toggle like on a comment."""
    cid = parse_uuid_or_404(comment_id, "Comment not found")
    if not get_comment_by_id(db, cid):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
    reacted, count = toggle_comment_reaction(db, UUID(current_user.auth_user_id), cid)
    return ToggleReactionResponse(reacted=reacted, reaction_count=count)
