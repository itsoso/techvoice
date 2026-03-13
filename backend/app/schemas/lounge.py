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
    created_at: datetime


class LoungeEventCreateRequest(BaseModel):
    title: str
    description: str | None = None
    ticket_open_at: datetime
    start_at: datetime
    end_at: datetime
    ticket_limit: int


class LoungeEventListResponse(BaseModel):
    items: list[LoungeEventRead]


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
    session_id: int
    entered: bool = True


class LoungeSessionClaimResponse(BaseModel):
    session_id: int
    status: str
