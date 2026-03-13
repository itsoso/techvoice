from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select

from app.models import LoungeEvent, Tenant, TenantAdmin
from app.scripts.bootstrap_tenant_lounge import TenantBootstrapPayload, bootstrap_tenant_lounge


def test_bootstrap_tenant_lounge_creates_tenant_admin_and_event(db_session) -> None:
    now = datetime.now(timezone.utc)
    payload = TenantBootstrapPayload(
        tenant_slug="acme",
        tenant_name="Acme Corp",
        admin_username="acme-admin",
        admin_password="secret123",
        admin_display_name="Acme Admin",
        event_title="Friday Lounge",
        event_description="Live anonymous session",
        ticket_open_at=now + timedelta(minutes=10),
        start_at=now + timedelta(minutes=30),
        end_at=now + timedelta(minutes=90),
        ticket_limit=5,
    )

    result = bootstrap_tenant_lounge(db_session, payload)

    assert result["tenant"]["slug"] == "acme"
    assert result["tenant_admin"]["username"] == "acme-admin"
    assert result["lounge_event"]["title"] == "Friday Lounge"
    assert db_session.scalar(select(func.count(Tenant.id))) == 1
    assert db_session.scalar(select(func.count(TenantAdmin.id))) == 1
    assert db_session.scalar(select(func.count(LoungeEvent.id))) == 1


def test_bootstrap_tenant_lounge_is_idempotent_for_same_payload(db_session) -> None:
    now = datetime.now(timezone.utc)
    payload = TenantBootstrapPayload(
        tenant_slug="acme",
        tenant_name="Acme Corp",
        admin_username="acme-admin",
        admin_password="secret123",
        admin_display_name="Acme Admin",
        event_title="Friday Lounge",
        event_description="Live anonymous session",
        ticket_open_at=now + timedelta(minutes=10),
        start_at=now + timedelta(minutes=30),
        end_at=now + timedelta(minutes=90),
        ticket_limit=5,
    )

    bootstrap_tenant_lounge(db_session, payload)
    result = bootstrap_tenant_lounge(db_session, payload)

    assert result["tenant"]["slug"] == "acme"
    assert db_session.scalar(select(func.count(Tenant.id))) == 1
    assert db_session.scalar(select(func.count(TenantAdmin.id))) == 1
    assert db_session.scalar(select(func.count(LoungeEvent.id))) == 1
