from pydantic import BaseModel, Field


class NetworkStatsResponse(BaseModel):
    total_predictions: int = Field(ge=0)
    verified_predictions: int = Field(ge=0)
    publishing_analysts: int = Field(ge=0)
    saved_analysts: int = Field(ge=0)
    saving_investors: int = Field(ge=0)
