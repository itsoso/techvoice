from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import LoungeSenderType


class LoungeMessage(Base):
    __tablename__ = "lounge_messages"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("lounge_sessions.id", ondelete="CASCADE"), index=True)
    sender_type: Mapped[LoungeSenderType] = mapped_column(Enum(LoungeSenderType), nullable=False)
    sender_label: Mapped[str] = mapped_column(String(64), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    session = relationship("LoungeSession", back_populates="messages")
