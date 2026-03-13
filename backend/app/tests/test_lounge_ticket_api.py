from datetime import datetime, timedelta, timezone

from app.models import LoungeEvent, Tenant, TenantAdmin


def seed_tenant_event(
    db_session,
    *,
    tenant_slug: str = "acme",
    ticket_open_at: datetime,
    start_at: datetime,
    end_at: datetime,
    ticket_limit: int = 2,
) -> tuple[Tenant, LoungeEvent]:
    tenant = Tenant(slug=tenant_slug, name=f"{tenant_slug.title()} Corp")
    db_session.add(tenant)
    db_session.flush()

    admin = TenantAdmin(
        tenant_id=tenant.id,
        username=f"{tenant_slug}-admin",
        password_hash="hashed-password",
        display_name=f"{tenant_slug.title()} Admin",
    )
    db_session.add(admin)
    db_session.flush()

    event = LoungeEvent(
        tenant_id=tenant.id,
        created_by_admin_id=admin.id,
        title="Friday Lounge",
        description="Anonymous lounge for Friday",
        ticket_open_at=ticket_open_at,
        start_at=start_at,
        end_at=end_at,
        ticket_limit=ticket_limit,
    )
    db_session.add(event)
    db_session.commit()
    db_session.refresh(event)
    return tenant, event


def test_get_current_tenant_lounge_event(client, db_session) -> None:
    now = datetime.now(timezone.utc)
    _, event = seed_tenant_event(
        db_session,
        ticket_open_at=now - timedelta(minutes=5),
        start_at=now + timedelta(minutes=30),
        end_at=now + timedelta(hours=1),
    )

    response = client.get("/api/v1/tenants/acme/lounge-events/current")

    assert response.status_code == 200
    assert response.json()["id"] == event.id
    assert response.json()["title"] == "Friday Lounge"


def test_claim_ticket_returns_alias_and_entry_token(client, db_session) -> None:
    now = datetime.now(timezone.utc)
    _, event = seed_tenant_event(
        db_session,
        ticket_open_at=now - timedelta(minutes=5),
        start_at=now + timedelta(minutes=30),
        end_at=now + timedelta(hours=1),
        ticket_limit=2,
    )

    response = client.post(
        f"/api/v1/tenants/acme/lounge-events/{event.id}/claim-ticket",
        headers={"x-lounge-fingerprint": "device-a"},
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["ticket_code"].startswith("TKT-")
    assert payload["entry_token"]
    assert payload["alias_label"] == "匿名者A"


def test_claim_ticket_rejects_duplicate_fingerprint_and_sold_out(client, db_session) -> None:
    now = datetime.now(timezone.utc)
    _, event = seed_tenant_event(
        db_session,
        ticket_open_at=now - timedelta(minutes=5),
        start_at=now + timedelta(minutes=30),
        end_at=now + timedelta(hours=1),
        ticket_limit=1,
    )

    first = client.post(
        f"/api/v1/tenants/acme/lounge-events/{event.id}/claim-ticket",
        headers={"x-lounge-fingerprint": "device-a"},
    )
    duplicate = client.post(
        f"/api/v1/tenants/acme/lounge-events/{event.id}/claim-ticket",
        headers={"x-lounge-fingerprint": "device-a"},
    )
    sold_out = client.post(
        f"/api/v1/tenants/acme/lounge-events/{event.id}/claim-ticket",
        headers={"x-lounge-fingerprint": "device-b"},
    )

    assert first.status_code == 201
    assert duplicate.status_code == 409
    assert sold_out.status_code == 409


def test_enter_lounge_requires_active_window_and_valid_token(client, db_session) -> None:
    now = datetime.now(timezone.utc)
    _, future_event = seed_tenant_event(
        db_session,
        tenant_slug="future",
        ticket_open_at=now - timedelta(minutes=5),
        start_at=now + timedelta(minutes=30),
        end_at=now + timedelta(hours=1),
    )
    future_claim = client.post(
        f"/api/v1/tenants/future/lounge-events/{future_event.id}/claim-ticket",
        headers={"x-lounge-fingerprint": "device-future"},
    )
    assert future_claim.status_code == 201

    future_enter = client.post(
        f"/api/v1/tenants/future/lounge-events/{future_event.id}/enter",
        headers={"x-lounge-fingerprint": "device-future"},
        json={
            "ticket_code": future_claim.json()["ticket_code"],
            "entry_token": future_claim.json()["entry_token"],
        },
    )
    assert future_enter.status_code == 409

    _, live_event = seed_tenant_event(
        db_session,
        tenant_slug="live",
        ticket_open_at=now - timedelta(hours=1),
        start_at=now - timedelta(minutes=5),
        end_at=now + timedelta(minutes=30),
    )
    live_claim = client.post(
        f"/api/v1/tenants/live/lounge-events/{live_event.id}/claim-ticket",
        headers={"x-lounge-fingerprint": "device-live"},
    )
    assert live_claim.status_code == 409


def test_enter_lounge_succeeds_for_valid_ticket_in_live_window(client, db_session) -> None:
    now = datetime.now(timezone.utc)
    _, event = seed_tenant_event(
        db_session,
        ticket_open_at=now - timedelta(hours=1),
        start_at=now - timedelta(minutes=5),
        end_at=now + timedelta(minutes=30),
        ticket_limit=2,
    )

    from app.models import LoungeTicket

    ticket = LoungeTicket(
        event_id=event.id,
        ticket_code="TKT-LIVE01",
        client_fingerprint="device-live",
        entry_token_hash="entry-live",
        alias_label="匿名者A",
    )
    db_session.add(ticket)
    db_session.commit()

    response = client.post(
        f"/api/v1/tenants/acme/lounge-events/{event.id}/enter",
        headers={"x-lounge-fingerprint": "device-live"},
        json={"ticket_code": "TKT-LIVE01", "entry_token": "entry-live"},
    )

    assert response.status_code == 200
    assert response.json()["ticket_code"] == "TKT-LIVE01"
    assert response.json()["alias_label"] == "匿名者A"

    wrong_token = client.post(
        f"/api/v1/tenants/acme/lounge-events/{event.id}/enter",
        headers={"x-lounge-fingerprint": "device-live"},
        json={"ticket_code": "TKT-LIVE01", "entry_token": "wrong-token"},
    )
    assert wrong_token.status_code == 404


def test_tenant_slug_isolation_applies_to_ticket_routes(client, db_session) -> None:
    now = datetime.now(timezone.utc)
    _, event = seed_tenant_event(
        db_session,
        tenant_slug="isolated",
        ticket_open_at=now - timedelta(minutes=5),
        start_at=now + timedelta(minutes=30),
        end_at=now + timedelta(hours=1),
    )

    response = client.post(
        f"/api/v1/tenants/other/lounge-events/{event.id}/claim-ticket",
        headers={"x-lounge-fingerprint": "device-x"},
    )

    assert response.status_code == 404
