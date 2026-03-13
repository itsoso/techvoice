from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models import LoungeEvent, Tenant, TenantAdmin
from app.services.lounge_service import derive_lounge_event_status


def parse_timestamp(value: str) -> datetime:
    parsed = datetime.fromisoformat(value)
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


@dataclass(slots=True)
class TenantBootstrapPayload:
    tenant_slug: str
    tenant_name: str
    admin_username: str
    admin_password: str
    admin_display_name: str
    event_title: str | None = None
    event_description: str | None = None
    ticket_open_at: datetime | None = None
    start_at: datetime | None = None
    end_at: datetime | None = None
    ticket_limit: int | None = None

    def wants_event(self) -> bool:
        return self.event_title is not None


def get_or_create_tenant(db: Session, payload: TenantBootstrapPayload) -> Tenant:
    tenant = db.scalar(select(Tenant).where(Tenant.slug == payload.tenant_slug))
    if tenant is not None:
        return tenant

    tenant = Tenant(slug=payload.tenant_slug, name=payload.tenant_name)
    db.add(tenant)
    db.flush()
    return tenant


def get_or_create_tenant_admin(db: Session, tenant: Tenant, payload: TenantBootstrapPayload) -> TenantAdmin:
    admin = db.scalar(
        select(TenantAdmin).where(
            TenantAdmin.tenant_id == tenant.id,
            TenantAdmin.username == payload.admin_username,
        )
    )
    if admin is not None:
        return admin

    admin = TenantAdmin(
        tenant_id=tenant.id,
        username=payload.admin_username,
        password_hash=hash_password(payload.admin_password),
        display_name=payload.admin_display_name,
    )
    db.add(admin)
    db.flush()
    return admin


def validate_event_payload(payload: TenantBootstrapPayload) -> None:
    if not payload.wants_event():
        return

    required_values = [
        payload.event_title,
        payload.ticket_open_at,
        payload.start_at,
        payload.end_at,
        payload.ticket_limit,
    ]
    if any(value is None for value in required_values):
        raise ValueError("event payload is incomplete")
    if payload.ticket_limit <= 0:
        raise ValueError("ticket_limit must be positive")
    if payload.ticket_open_at >= payload.start_at:
        raise ValueError("ticket_open_at must be before start_at")
    if payload.start_at >= payload.end_at:
        raise ValueError("start_at must be before end_at")


def get_or_create_lounge_event(db: Session, tenant: Tenant, admin: TenantAdmin, payload: TenantBootstrapPayload) -> LoungeEvent | None:
    validate_event_payload(payload)
    if not payload.wants_event():
        return None

    existing = db.scalar(
        select(LoungeEvent).where(
            LoungeEvent.tenant_id == tenant.id,
            LoungeEvent.title == payload.event_title,
            LoungeEvent.start_at == payload.start_at,
        )
    )
    if existing is not None:
        return existing

    event = LoungeEvent(
        tenant_id=tenant.id,
        created_by_admin_id=admin.id,
        title=payload.event_title,
        description=payload.event_description,
        ticket_open_at=payload.ticket_open_at,
        start_at=payload.start_at,
        end_at=payload.end_at,
        ticket_limit=payload.ticket_limit,
        status=derive_lounge_event_status(payload.ticket_open_at, payload.start_at, payload.end_at),
    )
    db.add(event)
    db.flush()
    return event


def bootstrap_tenant_lounge(db: Session, payload: TenantBootstrapPayload) -> dict[str, Any]:
    tenant = get_or_create_tenant(db, payload)
    admin = get_or_create_tenant_admin(db, tenant, payload)
    event = get_or_create_lounge_event(db, tenant, admin, payload)
    db.commit()
    if event is not None:
        db.refresh(event)
    db.refresh(tenant)
    db.refresh(admin)
    return {
        "tenant": {
            "id": tenant.id,
            "slug": tenant.slug,
            "name": tenant.name,
        },
        "tenant_admin": {
            "id": admin.id,
            "username": admin.username,
            "display_name": admin.display_name,
        },
        "lounge_event": None
        if event is None
        else {
            "id": event.id,
            "title": event.title,
            "status": event.status.value,
            "ticket_limit": event.ticket_limit,
            "start_at": event.start_at.isoformat(),
            "end_at": event.end_at.isoformat(),
        },
    }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Bootstrap one tenant and its anonymous lounge configuration.")
    parser.add_argument("--tenant-slug", required=True)
    parser.add_argument("--tenant-name", required=True)
    parser.add_argument("--admin-username", required=True)
    parser.add_argument("--admin-password", required=True)
    parser.add_argument("--admin-display-name", required=True)
    parser.add_argument("--event-title")
    parser.add_argument("--event-description")
    parser.add_argument("--ticket-open-at")
    parser.add_argument("--start-at")
    parser.add_argument("--end-at")
    parser.add_argument("--ticket-limit", type=int)
    return parser


def payload_from_args(args: argparse.Namespace) -> TenantBootstrapPayload:
    return TenantBootstrapPayload(
        tenant_slug=args.tenant_slug,
        tenant_name=args.tenant_name,
        admin_username=args.admin_username,
        admin_password=args.admin_password,
        admin_display_name=args.admin_display_name,
        event_title=args.event_title,
        event_description=args.event_description,
        ticket_open_at=parse_timestamp(args.ticket_open_at) if args.ticket_open_at else None,
        start_at=parse_timestamp(args.start_at) if args.start_at else None,
        end_at=parse_timestamp(args.end_at) if args.end_at else None,
        ticket_limit=args.ticket_limit,
    )


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()
    payload = payload_from_args(args)

    Base.metadata.create_all(bind=engine)
    with SessionLocal() as session:
        result = bootstrap_tenant_lounge(session, payload)

    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
