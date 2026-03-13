from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.enums import ExecutiveApprovalStatus


class ExecutiveRegisterRequest(BaseModel):
    name: str
    email: str
    title: str
    password: str


class ExecutiveLoginRequest(BaseModel):
    email: str
    password: str


class ExecutiveRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    title: str
    approval_status: ExecutiveApprovalStatus
    created_at: datetime


class ExecutiveListResponse(BaseModel):
    items: list[ExecutiveRead]


class QueueItemRead(BaseModel):
    session_id: int
    event_id: int
    alias_label: str
    entered_at: datetime | None
    created_at: datetime


class QueueListResponse(BaseModel):
    items: list[QueueItemRead]
