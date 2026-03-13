from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import TenantStatus


class Tenant(Base):
    __tablename__ = "tenants"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    slug: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[TenantStatus] = mapped_column(Enum(TenantStatus), default=TenantStatus.ACTIVE, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    tenant_admins = relationship("TenantAdmin", back_populates="tenant", cascade="all, delete-orphan")
    executives = relationship("Executive", back_populates="tenant", cascade="all, delete-orphan")
    lounge_events = relationship("LoungeEvent", back_populates="tenant", cascade="all, delete-orphan")
