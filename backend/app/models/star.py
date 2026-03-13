from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Star(Base):
    __tablename__ = "stars"
    __table_args__ = (UniqueConstraint("feedback_id", "client_fingerprint", name="uq_feedback_star"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    feedback_id: Mapped[int] = mapped_column(ForeignKey("feedbacks.id", ondelete="CASCADE"), index=True)
    client_fingerprint: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    feedback = relationship("Feedback", back_populates="stars")
