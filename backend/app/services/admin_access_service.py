"""
Admin role checks. Admins are users whose `users.badge` is 'admin'.
Mirrors the Supabase SQL function public.is_admin(); keep the two rules in sync.
"""

from typing import Optional
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.user import User

ADMIN_BADGE = "admin"

def is_admin(user: Optional[User]) -> bool:
    """True when the loaded user row carries the admin badge."""
    return user is not None and user.badge == ADMIN_BADGE

def is_admin_user_id(db: Session, user_id: Optional[UUID]) -> bool:
    """True when the user with this id is an admin. Unknown or missing ids are not admins."""
    if user_id is None:
        return False
    return is_admin(db.get(User, user_id))
