from datetime import datetime, timezone
from typing import Any

from sqlalchemy import JSON, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import ActorType, EventType


class FeedbackEvent(Base):
    __tablename__ = "feedback_events"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    feedback_id: Mapped[int] = mapped_column(ForeignKey("feedbacks.id", ondelete="CASCADE"), index=True)
    actor_type: Mapped[ActorType] = mapped_column(Enum(ActorType), nullable=False)
    event_type: Mapped[EventType] = mapped_column(Enum(EventType), nullable=False)
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    meta_json: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    feedback = relationship("Feedback", back_populates="events")
