from datetime import datetime, timedelta, timezone

from app.models import Executive, LoungeEvent, LoungeMessage, LoungeSession, LoungeTicket, Tenant, TenantAdmin
from app.models.enums import ExecutiveApprovalStatus, LoungeEventStatus, LoungeSessionStatus, LoungeTicketStatus


def test_lounge_domain_models_persist_and_expose_defaults(db_session) -> None:
    tenant = Tenant(slug="acme", name="Acme Corp")
    db_session.add(tenant)
    db_session.flush()

    admin = TenantAdmin(
        tenant_id=tenant.id,
        username="acme-admin",
        password_hash="hashed-password",
        display_name="Acme Admin",
    )
    executive = Executive(
        tenant_id=tenant.id,
        name="Alice Wang",
        email="alice@example.com",
        title="VP of Engineering",
        password_hash="hashed-password",
    )
    db_session.add_all([admin, executive])
    db_session.flush()

    event = LoungeEvent(
        tenant_id=tenant.id,
        created_by_admin_id=admin.id,
        title="Friday Lounge",
        description="Weekly anonymous lounge",
        ticket_open_at=datetime.now(timezone.utc) - timedelta(minutes=30),
        start_at=datetime.now(timezone.utc) + timedelta(minutes=30),
        end_at=datetime.now(timezone.utc) + timedelta(hours=1, minutes=30),
        ticket_limit=5,
    )
    db_session.add(event)
    db_session.flush()

    ticket = LoungeTicket(
        event_id=event.id,
        ticket_code="TKT-0001",
        client_fingerprint="browser-device-1",
        entry_token_hash="entry-token-hash",
        alias_label="匿名者A",
    )
    db_session.add(ticket)
    db_session.flush()

    session = LoungeSession(
        event_id=event.id,
        ticket_id=ticket.id,
        executive_id=executive.id,
    )
    db_session.add(session)
    db_session.flush()

    message = LoungeMessage(
        session_id=session.id,
        sender_type="participant",
        sender_label=ticket.alias_label,
        content="我想聊聊流程问题。",
    )
    db_session.add(message)
    db_session.commit()

    db_session.refresh(executive)
    db_session.refresh(event)
    db_session.refresh(ticket)
    db_session.refresh(session)

    assert tenant.slug == "acme"
    assert executive.approval_status == ExecutiveApprovalStatus.PENDING
    assert event.status == LoungeEventStatus.DRAFT
    assert ticket.status == LoungeTicketStatus.CLAIMED
    assert session.status == LoungeSessionStatus.WAITING
    assert message.sender_label == "匿名者A"
    assert session.event_id == event.id
    assert session.ticket_id == ticket.id
