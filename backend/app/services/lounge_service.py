from __future__ import annotations

from datetime import datetime, timezone
from secrets import token_hex

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Executive, LoungeEvent, LoungeMessage, LoungeSession, LoungeTicket, Tenant, TenantAdmin
from app.models.enums import LoungeEventStatus, LoungeSenderType, LoungeSessionStatus, LoungeTicketStatus
from app.schemas.lounge import LoungeEnterRequest, LoungeEventCreateRequest


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


def derive_lounge_event_status(ticket_open_at: datetime, start_at: datetime, end_at: datetime) -> LoungeEventStatus:
    now = datetime.now(timezone.utc)
    ticket_open_at = as_utc(ticket_open_at)
    start_at = as_utc(start_at)
    end_at = as_utc(end_at)

    if now >= end_at:
        return LoungeEventStatus.CLOSED
    if now >= start_at:
        return LoungeEventStatus.LIVE
    if now >= ticket_open_at:
        return LoungeEventStatus.TICKETING
    return LoungeEventStatus.DRAFT


def get_lounge_event_for_tenant(db: Session, tenant_slug: str, event_id: int) -> LoungeEvent:
    tenant = get_tenant_by_slug(db, tenant_slug)
    event = db.scalar(select(LoungeEvent).where(LoungeEvent.id == event_id, LoungeEvent.tenant_id == tenant.id))
    if event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="event not found")
    return event


def ensure_event_is_live(event: LoungeEvent) -> None:
    now = datetime.now(timezone.utc)
    start_at = as_utc(event.start_at)
    end_at = as_utc(event.end_at)
    if now < start_at or now >= end_at:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="event is not live")


def close_lounge_session(db: Session, session: LoungeSession) -> LoungeSession:
    if session.status in [LoungeSessionStatus.CLOSED, LoungeSessionStatus.ARCHIVED]:
        return session
    session.status = LoungeSessionStatus.CLOSED
    session.closed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(session)
    return session


def get_or_create_lounge_session(db: Session, ticket: LoungeTicket) -> LoungeSession:
    session = db.scalar(
        select(LoungeSession)
        .where(
            LoungeSession.ticket_id == ticket.id,
            LoungeSession.status.in_([LoungeSessionStatus.WAITING, LoungeSessionStatus.ACTIVE]),
        )
        .order_by(LoungeSession.id.desc())
    )
    if session is not None:
        return session

    session = LoungeSession(event_id=ticket.event_id, ticket_id=ticket.id)
    db.add(session)
    db.flush()
    return session


def generate_alias_label(position: int) -> str:
    alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    if position <= len(alphabet):
        return f"匿名者{alphabet[position - 1]}"
    return f"匿名者{position}"


def create_lounge_event(db: Session, admin: TenantAdmin, payload: LoungeEventCreateRequest) -> LoungeEvent:
    if as_utc(payload.ticket_open_at) >= as_utc(payload.start_at):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="ticket_open_at must be before start_at")
    if as_utc(payload.start_at) >= as_utc(payload.end_at):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="start_at must be before end_at")
    if payload.ticket_limit <= 0:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="ticket_limit must be positive")

    event = LoungeEvent(
        tenant_id=admin.tenant_id,
        created_by_admin_id=admin.id,
        title=payload.title.strip(),
        description=payload.description.strip() if payload.description else None,
        ticket_open_at=payload.ticket_open_at,
        start_at=payload.start_at,
        end_at=payload.end_at,
        ticket_limit=payload.ticket_limit,
        status=derive_lounge_event_status(payload.ticket_open_at, payload.start_at, payload.end_at),
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


def list_lounge_events_for_tenant(db: Session, tenant_id: int) -> list[LoungeEvent]:
    return list(
        db.scalars(
            select(LoungeEvent).where(LoungeEvent.tenant_id == tenant_id).order_by(LoungeEvent.start_at.desc())
        )
    )


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
) -> tuple[LoungeTicket, LoungeSession]:
    event = get_lounge_event_for_tenant(db, tenant_slug, event_id)
    now = datetime.now(timezone.utc)
    ensure_event_is_live(event)

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
    session = get_or_create_lounge_session(db, ticket)
    db.commit()
    db.refresh(ticket)
    db.refresh(session)
    return ticket, session


def get_waiting_sessions_for_executive(db: Session, executive: Executive) -> list[LoungeSession]:
    now = datetime.now(timezone.utc)
    return list(
        db.scalars(
            select(LoungeSession)
            .join(LoungeEvent, LoungeSession.event_id == LoungeEvent.id)
            .join(LoungeTicket, LoungeSession.ticket_id == LoungeTicket.id)
            .where(
                LoungeEvent.tenant_id == executive.tenant_id,
                LoungeEvent.start_at <= now,
                LoungeEvent.end_at > now,
                LoungeSession.status == LoungeSessionStatus.WAITING,
            )
            .order_by(LoungeSession.created_at.asc())
        )
    )


def claim_lounge_session(db: Session, tenant_slug: str, session_id: int, executive: Executive) -> LoungeSession:
    event = None
    session = db.scalar(
        select(LoungeSession).join(LoungeEvent).where(
            LoungeSession.id == session_id,
            LoungeEvent.tenant_id == executive.tenant_id,
        )
    )
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="session not found")

    event = session.event
    if event.tenant.slug != tenant_slug:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="tenant mismatch")

    ensure_event_is_live(event)
    if session.status != LoungeSessionStatus.WAITING:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="session already claimed")

    session.executive_id = executive.id
    session.status = LoungeSessionStatus.ACTIVE
    session.claimed_by_executive_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(session)
    return session


def get_participant_session(
    db: Session,
    tenant_slug: str,
    event_id: int,
    ticket_code: str,
    entry_token: str,
) -> LoungeSession:
    event = get_lounge_event_for_tenant(db, tenant_slug, event_id)
    ensure_event_is_live(event)
    ticket = db.scalar(
        select(LoungeTicket).where(
            LoungeTicket.event_id == event.id,
            LoungeTicket.ticket_code == ticket_code,
            LoungeTicket.entry_token_hash == entry_token,
        )
    )
    if ticket is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ticket not found")

    session = get_or_create_lounge_session(db, ticket)
    db.commit()
    db.refresh(session)
    return session


def get_executive_session_for_message(db: Session, executive: Executive, session_id: int) -> LoungeSession:
    db.expire_all()
    session = db.scalar(
        select(LoungeSession)
        .join(LoungeEvent)
        .where(
            LoungeSession.id == session_id,
            LoungeEvent.tenant_id == executive.tenant_id,
        )
    )
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="session not found")
    if session.executive_id != executive.id or session.status != LoungeSessionStatus.ACTIVE:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="session not assigned")
    ensure_event_is_live(session.event)
    return session


def create_participant_message(db: Session, session_id: int, content: str) -> LoungeMessage:
    db.expire_all()
    session = db.scalar(select(LoungeSession).where(LoungeSession.id == session_id))
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="session not found")
    if session.status != LoungeSessionStatus.ACTIVE:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="session is not active")
    ensure_event_is_live(session.event)

    message = LoungeMessage(
        session_id=session.id,
        sender_type=LoungeSenderType.PARTICIPANT,
        sender_label=session.ticket.alias_label,
        content=content.strip(),
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


def create_executive_message(db: Session, session: LoungeSession, executive: Executive, content: str) -> LoungeMessage:
    message = LoungeMessage(
        session_id=session.id,
        sender_type=LoungeSenderType.EXECUTIVE,
        sender_label=executive.name,
        content=content.strip(),
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message
