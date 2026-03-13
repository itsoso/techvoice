from datetime import datetime, timedelta, timezone

from app.core.security import hash_password
from app.models import Executive, LoungeEvent, LoungeTicket, Tenant, TenantAdmin
from app.models.enums import ExecutiveApprovalStatus


def seed_live_lounge_stack(db_session) -> tuple[Tenant, LoungeEvent, Executive]:
    tenant = Tenant(slug="acme", name="Acme Corp")
    db_session.add(tenant)
    db_session.flush()

    admin = TenantAdmin(
        tenant_id=tenant.id,
        username="acme-admin",
        password_hash=hash_password("admin123456"),
        display_name="Acme Admin",
    )
    executive = Executive(
        tenant_id=tenant.id,
        name="Alice Wang",
        email="alice@example.com",
        title="VP of Engineering",
        password_hash=hash_password("secret123"),
        approval_status=ExecutiveApprovalStatus.APPROVED,
    )
    db_session.add_all([admin, executive])
    db_session.flush()

    now = datetime.now(timezone.utc)
    event = LoungeEvent(
        tenant_id=tenant.id,
        created_by_admin_id=admin.id,
        title="Friday Lounge",
        description="Live anonymous lounge",
        ticket_open_at=now - timedelta(hours=1),
        start_at=now - timedelta(minutes=5),
        end_at=now + timedelta(minutes=30),
        ticket_limit=5,
    )
    db_session.add(event)
    db_session.commit()
    db_session.refresh(event)
    db_session.refresh(executive)
    return tenant, event, executive


def test_participant_and_executive_can_exchange_messages_after_claim(client, db_session) -> None:
    _, event, _ = seed_live_lounge_stack(db_session)

    ticket = LoungeTicket(
        event_id=event.id,
        ticket_code="TKT-LIVECHAT",
        client_fingerprint="device-a",
        entry_token_hash="entry-livechat",
        alias_label="匿名者A",
    )
    db_session.add(ticket)
    db_session.commit()

    entered = client.post(
        f"/api/v1/tenants/acme/lounge-events/{event.id}/enter",
        headers={"x-lounge-fingerprint": "device-a"},
        json={
            "ticket_code": ticket.ticket_code,
            "entry_token": "entry-livechat",
        },
    )
    assert entered.status_code == 200
    session_id = entered.json()["session_id"]

    executive_login = client.post(
        "/api/v1/tenants/acme/executives/login",
        json={"email": "alice@example.com", "password": "secret123"},
    )
    assert executive_login.status_code == 200
    executive_token = executive_login.json()["access_token"]

    with client.websocket_connect(
        f"/api/v1/ws/tenants/acme/lounge-events/{event.id}/participant"
        f"?ticket_code={ticket.ticket_code}&entry_token=entry-livechat"
    ) as participant_ws:
        waiting = participant_ws.receive_json()
        assert waiting["type"] == "waiting"

        with client.websocket_connect(
            f"/api/v1/ws/tenants/acme/executive/lounge?access_token={executive_token}"
        ) as executive_ws:
            connected = executive_ws.receive_json()
            assert connected["type"] == "connected"

            queue_response = client.get(
                "/api/v1/tenants/acme/executive/lounge-queue",
                headers={"Authorization": f"Bearer {executive_token}"},
            )
            assert queue_response.status_code == 200
            assert queue_response.json()["items"][0]["session_id"] == session_id

            claim_response = client.post(
                f"/api/v1/tenants/acme/executive/lounge-sessions/{session_id}/claim",
                headers={"Authorization": f"Bearer {executive_token}"},
            )
            assert claim_response.status_code == 200
            assert claim_response.json()["status"] == "active"

            session_claimed = participant_ws.receive_json()
            assert session_claimed["type"] == "session_claimed"
            assert session_claimed["session_id"] == session_id

            participant_ws.send_json({"type": "send_message", "content": "我想聊聊技术债。"})
            inbound_for_executive = executive_ws.receive_json()
            assert inbound_for_executive["type"] == "message_sent"
            assert inbound_for_executive["sender_type"] == "participant"
            assert inbound_for_executive["content"] == "我想聊聊技术债。"

            executive_ws.send_json({"type": "send_message", "session_id": session_id, "content": "收到，我们马上看。"})
            inbound_for_participant = participant_ws.receive_json()
            assert inbound_for_participant["type"] == "message_sent"
            assert inbound_for_participant["sender_type"] == "executive"
            assert inbound_for_participant["content"] == "收到，我们马上看。"


def test_same_waiting_session_cannot_be_claimed_twice(client, db_session) -> None:
    _, event, executive = seed_live_lounge_stack(db_session)

    ticket = LoungeTicket(
        event_id=event.id,
        ticket_code="TKT-LIVE02",
        client_fingerprint="device-a",
        entry_token_hash="entry-live02",
        alias_label="匿名者A",
    )
    db_session.add(ticket)
    db_session.commit()

    entered = client.post(
        f"/api/v1/tenants/acme/lounge-events/{event.id}/enter",
        headers={"x-lounge-fingerprint": "device-a"},
        json={
            "ticket_code": ticket.ticket_code,
            "entry_token": "entry-live02",
        },
    )
    session_id = entered.json()["session_id"]

    second_executive = Executive(
        tenant_id=executive.tenant_id,
        name="Bob Li",
        email="bob@example.com",
        title="HR Director",
        password_hash=hash_password("secret123"),
        approval_status=ExecutiveApprovalStatus.APPROVED,
    )
    db_session.add(second_executive)
    db_session.commit()

    alice_login = client.post(
        "/api/v1/tenants/acme/executives/login",
        json={"email": "alice@example.com", "password": "secret123"},
    )
    bob_login = client.post(
        "/api/v1/tenants/acme/executives/login",
        json={"email": "bob@example.com", "password": "secret123"},
    )

    first_claim = client.post(
        f"/api/v1/tenants/acme/executive/lounge-sessions/{session_id}/claim",
        headers={"Authorization": f"Bearer {alice_login.json()['access_token']}"},
    )
    second_claim = client.post(
        f"/api/v1/tenants/acme/executive/lounge-sessions/{session_id}/claim",
        headers={"Authorization": f"Bearer {bob_login.json()['access_token']}"},
    )

    assert first_claim.status_code == 200
    assert second_claim.status_code == 409
