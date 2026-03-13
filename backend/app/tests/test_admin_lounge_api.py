from app.core.security import hash_password
from app.models import Executive, Tenant, TenantAdmin


def seed_tenant_and_pending_executive(db_session, tenant_slug: str = "acme") -> tuple[Tenant, TenantAdmin, Executive]:
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
    db_session.flush()

    executive = Executive(
        tenant_id=tenant.id,
        name="Carol Zhou",
        email="carol@example.com",
        title="COO",
        password_hash=hash_password("secret123"),
    )
    db_session.add(executive)
    db_session.commit()
    db_session.refresh(admin)
    db_session.refresh(executive)
    return tenant, admin, executive


def test_tenant_admin_can_list_and_approve_executives(client, db_session) -> None:
    _, _, executive = seed_tenant_and_pending_executive(db_session)

    login_response = client.post(
        "/api/v1/tenants/acme/admin/auth/login",
        json={"username": "acme-admin", "password": "admin123456"},
    )
    assert login_response.status_code == 200
    access_token = login_response.json()["access_token"]

    pending_response = client.get(
        "/api/v1/tenants/acme/admin/executives",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert pending_response.status_code == 200
    assert pending_response.json()["items"][0]["approval_status"] == "pending"

    approve_response = client.post(
        f"/api/v1/tenants/acme/admin/executives/{executive.id}/approve",
        headers={"Authorization": f"Bearer {access_token}"},
    )

    assert approve_response.status_code == 200
    assert approve_response.json()["approval_status"] == "approved"
