from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import LoungeEventStatus


class LoungeEvent(Base):
    __tablename__ = "lounge_events"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenants.id", ondelete="CASCADE"), index=True)
    created_by_admin_id: Mapped[int] = mapped_column(ForeignKey("tenant_admins.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    ticket_open_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    start_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ticket_limit: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[LoungeEventStatus] = mapped_column(
        Enum(LoungeEventStatus),
        default=LoungeEventStatus.DRAFT,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    tenant = relationship("Tenant", back_populates="lounge_events")
    created_by_admin = relationship("TenantAdmin", back_populates="lounge_events")
    tickets = relationship("LoungeTicket", back_populates="event", cascade="all, delete-orphan")
    sessions = relationship("LoungeSession", back_populates="event", cascade="all, delete-orphan")
