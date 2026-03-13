from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator, model_validator

from app.models.enums import ActorType, EventType, FeedbackStatus, FeedbackType

VALID_CATEGORIES = {
    "engineering_process",
    "tooling_efficiency",
    "team_culture",
    "collaboration",
    "technical_debt",
}


class FeedbackCreate(BaseModel):
    type: FeedbackType
    category: str
    title: str | None = None
    content_markdown: str | None = None
    proposal_problem: str | None = None
    proposal_impact: str | None = None
    proposal_suggestion: str | None = None

    @field_validator("category")
    @classmethod
    def validate_category(cls, value: str) -> str:
        if value not in VALID_CATEGORIES:
            raise ValueError("invalid category")
        return value

    @model_validator(mode="after")
    def validate_shape(self) -> "FeedbackCreate":
        if self.type == FeedbackType.VENT and not self.content_markdown:
            raise ValueError("vent feedback requires content_markdown")

        if self.type == FeedbackType.PROPOSAL and not all(
            [self.proposal_problem, self.proposal_impact, self.proposal_suggestion]
        ):
            raise ValueError("proposal feedback requires all proposal fields")

        return self


class FeedbackCreateResponse(BaseModel):
    thread_code: str


class FeedbackReplyCreate(BaseModel):
    content: str


class FeedbackEventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    actor_type: ActorType
    event_type: EventType
    content: str | None
    meta_json: dict | None
    created_at: datetime


class FeedbackDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    thread_code: str
    public_code: str
    type: FeedbackType
    category: str
    status: FeedbackStatus
    is_public: bool
    star_count: int
    title: str | None
    content_markdown: str | None
    proposal_problem: str | None
    proposal_impact: str | None
    proposal_suggestion: str | None
    created_at: datetime
    updated_at: datetime
    events: list[FeedbackEventRead]


class FeedbackReplyResponse(BaseModel):
    created: bool = True


class FeedbackSummaryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    thread_code: str
    public_code: str
    type: FeedbackType
    category: str
    status: FeedbackStatus
    is_public: bool
    star_count: int
    title: str | None
    created_at: datetime
    updated_at: datetime


class FeedbackListResponse(BaseModel):
    items: list[FeedbackSummaryRead]
    total: int
    page: int
    page_size: int


class FeedbackStatusUpdate(BaseModel):
    status: FeedbackStatus
    reason: str | None = None


class AdminReplyCreate(BaseModel):
    content: str


class PublicAdminReplyRead(BaseModel):
    content: str
    created_at: datetime


class PublicEmployeeReplyRead(BaseModel):
    content: str
    created_at: datetime


class PublicFeedbackRead(BaseModel):
    public_code: str
    type: FeedbackType
    category: str
    status: FeedbackStatus
    title: str | None
    content_markdown: str | None
    proposal_problem: str | None
    proposal_impact: str | None
    proposal_suggestion: str | None
    admin_replies: list[PublicAdminReplyRead]
    employee_replies: list[PublicEmployeeReplyRead]
    star_count: int
    created_at: datetime


class PublicFeedbackListResponse(BaseModel):
    items: list[PublicFeedbackRead]


class StarResponse(BaseModel):
    star_count: int
