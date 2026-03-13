from __future__ import annotations

from datetime import datetime, timezone
from secrets import token_hex

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import LoungeEvent, LoungeTicket, Tenant
from app.models.enums import LoungeTicketStatus
from app.schemas.lounge import LoungeEnterRequest


def as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def get_tenant_by_slug(db: Session, tenant_slug: str) -> Tenant:
    tenant = db.scalar(select(Tenant).where(Tenant.slug == tenant_slug))
    if tenant is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="tenant not found")
    return tenant


def get_current_lounge_event(db: Session, tenant_slug: str) -> LoungeEvent:
    tenant = get_tenant_by_slug(db, tenant_slug)
    now = datetime.now(timezone.utc)
    event = db.scalar(
        select(LoungeEvent)
        .where(LoungeEvent.tenant_id == tenant.id, LoungeEvent.end_at > now)
        .order_by(LoungeEvent.start_at.asc())
    )
    if event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="event not found")
    return event


def get_lounge_event_for_tenant(db: Session, tenant_slug: str, event_id: int) -> LoungeEvent:
    tenant = get_tenant_by_slug(db, tenant_slug)
    event = db.scalar(select(LoungeEvent).where(LoungeEvent.id == event_id, LoungeEvent.tenant_id == tenant.id))
    if event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="event not found")
    return event


def generate_alias_label(position: int) -> str:
    alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    if position <= len(alphabet):
        return f"匿名者{alphabet[position - 1]}"
    return f"匿名者{position}"


def claim_lounge_ticket(db: Session, tenant_slug: str, event_id: int, fingerprint: str) -> tuple[LoungeTicket, str]:
    event = get_lounge_event_for_tenant(db, tenant_slug, event_id)
    now = datetime.now(timezone.utc)
    ticket_open_at = as_utc(event.ticket_open_at)
    start_at = as_utc(event.start_at)

    if now < ticket_open_at or now >= start_at:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="ticket window is closed")

    existing = db.scalar(
        select(LoungeTicket).where(
            LoungeTicket.event_id == event.id,
            LoungeTicket.client_fingerprint == fingerprint,
        )
    )
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="ticket already claimed")

    claimed_count = db.scalar(select(func.count(LoungeTicket.id)).where(LoungeTicket.event_id == event.id)) or 0
    if claimed_count >= event.ticket_limit:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="ticket sold out")

    entry_token = token_hex(8)
    ticket = LoungeTicket(
        event_id=event.id,
        ticket_code=f"TKT-{token_hex(4).upper()}",
        client_fingerprint=fingerprint,
        entry_token_hash=entry_token,
        alias_label=generate_alias_label(claimed_count + 1),
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket, entry_token


def enter_lounge(
    db: Session,
    tenant_slug: str,
    event_id: int,
    fingerprint: str,
    payload: LoungeEnterRequest,
) -> LoungeTicket:
    event = get_lounge_event_for_tenant(db, tenant_slug, event_id)
    now = datetime.now(timezone.utc)
    start_at = as_utc(event.start_at)
    end_at = as_utc(event.end_at)

    if now < start_at or now >= end_at:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="event is not live")

    ticket = db.scalar(
        select(LoungeTicket).where(
            LoungeTicket.event_id == event.id,
            LoungeTicket.ticket_code == payload.ticket_code,
            LoungeTicket.client_fingerprint == fingerprint,
            LoungeTicket.entry_token_hash == payload.entry_token,
        )
    )
    if ticket is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ticket not found")

    ticket.entered_at = now
    ticket.status = LoungeTicketStatus.ENTERED
    db.commit()
    db.refresh(ticket)
    return ticket
