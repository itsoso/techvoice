from app.core.security import hash_password
from app.models import Executive, Tenant, TenantAdmin


def seed_tenant_and_admin(db_session, tenant_slug: str = "acme") -> tuple[Tenant, TenantAdmin]:
    tenant = Tenant(slug=tenant_slug, name=f"{tenant_slug.title()} Corp")
    db_session.add(tenant)
    db_session.flush()

    admin = TenantAdmin(
        tenant_id=tenant.id,
        username=f"{tenant_slug}-admin",
        password_hash=hash_password("admin123456"),
        display_name=f"{tenant_slug.title()} Admin",
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(tenant)
    db_session.refresh(admin)
    return tenant, admin


def test_executive_can_register_but_cannot_login_while_pending(client, db_session) -> None:
    seed_tenant_and_admin(db_session)

    register_response = client.post(
        "/api/v1/tenants/acme/executives/register",
        json={
            "name": "Alice Wang",
            "email": "alice@example.com",
            "title": "VP of Engineering",
            "password": "secret123",
        },
    )

    assert register_response.status_code == 201
    assert register_response.json()["approval_status"] == "pending"

    login_response = client.post(
        "/api/v1/tenants/acme/executives/login",
        json={"email": "alice@example.com", "password": "secret123"},
    )

    assert login_response.status_code == 403


def test_approved_executive_can_login_and_access_queue(client, db_session) -> None:
    _, admin = seed_tenant_and_admin(db_session)
    executive = Executive(
        tenant_id=admin.tenant_id,
        name="Bob Li",
        email="bob@example.com",
        title="HR Director",
        password_hash=hash_password("secret123"),
        approval_status="approved",
    )
    db_session.add(executive)
    db_session.commit()

    login_response = client.post(
        "/api/v1/tenants/acme/executives/login",
        json={"email": "bob@example.com", "password": "secret123"},
    )

    assert login_response.status_code == 200
    access_token = login_response.json()["access_token"]

    queue_response = client.get(
        "/api/v1/tenants/acme/executive/lounge-queue",
        headers={"Authorization": f"Bearer {access_token}"},
    )

    assert queue_response.status_code == 200
    assert queue_response.json()["items"] == []
