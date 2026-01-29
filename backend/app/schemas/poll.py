"""
Poll vote, results, and creation schemas.
"""
from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel, Field, field_validator

class PollCreate(BaseModel):
    """Poll payload when creating a post or comment. Options 2-4, duration 1-7 days."""

    options: List[str] = Field(..., min_length=2, max_length=4)
    duration_days: int = Field(..., ge=1, le=7)

    @field_validator("options")
    @classmethod
    def options_non_empty(cls, v: List[str]) -> List[str]:
        if not v:
            raise ValueError("Poll must have at least 2 options")
        cleaned = [s.strip() for s in v if s and isinstance(s, str)]
        if len(cleaned) < 2:
            raise ValueError("Poll must have at least 2 non-empty options")
        if len(cleaned) > 4:
            raise ValueError("Poll must have at most 4 options")
        return cleaned

class VoteRequest(BaseModel):
    """Request body for POST /polls/{poll_id}/votes."""

    option_index: int = Field(..., ge=0)

class VoteResponse(BaseModel):
    """Response after voting."""

    voted: bool = True
    option_index: int
    results: Dict[int, int]
    total_votes: int

class PollResultsResponse(BaseModel):
    """Response for GET /polls/{poll_id}/results."""

    poll_id: str
    options: List[str]
    results: Dict[int, int]
    total_votes: int
    user_vote: Optional[int] = None
    is_finished: bool
    expires_at: datetime
