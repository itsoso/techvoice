from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import LoungeSessionStatus


class LoungeSession(Base):
    __tablename__ = "lounge_sessions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("lounge_events.id", ondelete="CASCADE"), index=True)
    ticket_id: Mapped[int] = mapped_column(ForeignKey("lounge_tickets.id", ondelete="CASCADE"), index=True)
    executive_id: Mapped[int | None] = mapped_column(ForeignKey("executives.id", ondelete="SET NULL"), index=True)
    status: Mapped[LoungeSessionStatus] = mapped_column(
        Enum(LoungeSessionStatus),
        default=LoungeSessionStatus.WAITING,
        nullable=False,
    )
    claimed_by_executive_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    event = relationship("LoungeEvent", back_populates="sessions")
    ticket = relationship("LoungeTicket", back_populates="sessions")
    executive = relationship("Executive", back_populates="lounge_sessions")
    messages = relationship("LoungeMessage", back_populates="session", cascade="all, delete-orphan")
