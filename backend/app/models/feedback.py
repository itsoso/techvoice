from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import FeedbackStatus, FeedbackType


class Feedback(Base):
    __tablename__ = "feedbacks"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    thread_code: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    public_code: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    type: Mapped[FeedbackType] = mapped_column(Enum(FeedbackType), nullable=False)
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    content_markdown: Mapped[str | None] = mapped_column(Text, nullable=True)
    proposal_problem: Mapped[str | None] = mapped_column(Text, nullable=True)
    proposal_impact: Mapped[str | None] = mapped_column(Text, nullable=True)
    proposal_suggestion: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(50), index=True)
    status: Mapped[FeedbackStatus] = mapped_column(
        Enum(FeedbackStatus),
        default=FeedbackStatus.RECEIVED,
        nullable=False,
    )
    is_public: Mapped[bool] = mapped_column(default=False, nullable=False)
    star_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    events = relationship(
        "FeedbackEvent",
        back_populates="feedback",
        cascade="all, delete-orphan",
        order_by="FeedbackEvent.created_at",
    )
    stars = relationship(
        "Star",
        back_populates="feedback",
        cascade="all, delete-orphan",
    )
