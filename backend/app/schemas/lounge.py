from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.enums import LoungeEventStatus


class LoungeEventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str | None
    ticket_open_at: datetime
    start_at: datetime
    end_at: datetime
    ticket_limit: int
    status: LoungeEventStatus


class LoungeTicketClaimResponse(BaseModel):
    ticket_code: str
    entry_token: str
    alias_label: str


class LoungeEnterRequest(BaseModel):
    ticket_code: str
    entry_token: str


class LoungeEnterResponse(BaseModel):
    ticket_code: str
    alias_label: str
    entered: bool = True
