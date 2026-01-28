from fastapi import APIRouter, Depends
from app.middleware.auth import get_current_user
from app.services.auth_service import CurrentUser

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/verify")
async def verify_token(current_user: CurrentUser = Depends(get_current_user)):
    """
    Verify the current JWT and return a minimal user payload.

    This matches the shape described in the API docs:
    {
      "data": {
        "valid": true,
        "user": { ... }
      }
    }
    """
    claims = current_user.claims
    return {
        "data": {
            "valid": True,
            "user": {
                "id": current_user.auth_user_id,
                "email": claims.get("email"),
                "role": claims.get("role"),
            },
        }
    }
