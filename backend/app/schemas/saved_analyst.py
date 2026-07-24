from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class SavedAnalystItem(BaseModel):
    id: str
    handle: str
    display_name: str
    avatar: str
    subscription_plan_id: Optional[str] = None
    saved_at: datetime


class SavedAnalystToggleResponse(BaseModel):
    saved: bool
