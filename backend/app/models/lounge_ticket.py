from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import LoungeTicketStatus


class LoungeTicket(Base):
    __tablename__ = "lounge_tickets"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("lounge_events.id", ondelete="CASCADE"), index=True)
    ticket_code: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    client_fingerprint: Mapped[str] = mapped_column(String(255), nullable=False)
    entry_token_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    alias_label: Mapped[str] = mapped_column(String(64), nullable=False)
    claimed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    entered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[LoungeTicketStatus] = mapped_column(
        Enum(LoungeTicketStatus),
        default=LoungeTicketStatus.CLAIMED,
        nullable=False,
    )

    event = relationship("LoungeEvent", back_populates="tickets")
    sessions = relationship("LoungeSession", back_populates="ticket")
