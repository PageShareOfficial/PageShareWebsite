"""
Reaction (like) response schemas.
"""
from pydantic import BaseModel

class ToggleReactionResponse(BaseModel):
    """Response after toggling a reaction."""

    reacted: bool
    reaction_count: int
