"""
Poll endpoints: vote, get results.
"""
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import get_current_user, get_optional_user
from app.schemas.poll import PollResultsResponse, VoteRequest, VoteResponse
from app.services.auth_service import CurrentUser
from app.services.poll_service import get_poll_by_id, get_results, vote
from app.utils.http import parse_uuid_or_404
from typing import Optional

router = APIRouter(prefix="/polls", tags=["polls"])

@router.post("/{poll_id}/votes", response_model=dict, status_code=status.HTTP_201_CREATED)
def vote_poll_endpoint(
    poll_id: str,
    body: VoteRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Vote on a poll option. 409 if already voted, 422 if expired or invalid option."""
    pid = parse_uuid_or_404(poll_id, "Poll not found")
    try:
        results, total = vote(db, pid, UUID(current_user.auth_user_id), body.option_index)
        return {
            "data": VoteResponse(
                voted=True,
                option_index=body.option_index,
                results=results,
                total_votes=total,
            )
        }
    except ValueError as e:
        if "Poll not found" in str(e):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Poll not found")
        if "Poll expired" in str(e):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Poll expired",
            )
        if "Invalid option_index" in str(e):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Invalid option_index",
            )
        if "Already voted" in str(e):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already voted")
        raise

@router.get("/{poll_id}/results", response_model=dict)
def get_poll_results_endpoint(
    poll_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[CurrentUser] = Depends(get_optional_user),
):
    """Get poll results. Optional auth for user_vote."""
    pid = parse_uuid_or_404(poll_id, "Poll not found")
    poll = get_poll_by_id(db, pid)
    if not poll:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Poll not found")
    try:
        results, total, user_vote, is_finished, expires_at = get_results(
            db, pid, UUID(current_user.auth_user_id) if current_user else None
        )
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Poll not found")
    return {
        "data": PollResultsResponse(
            poll_id=str(poll.id),
            options=poll.options or [],
            results=results,
            total_votes=total,
            user_vote=user_vote,
            is_finished=is_finished,
            expires_at=expires_at,
        )
    }
