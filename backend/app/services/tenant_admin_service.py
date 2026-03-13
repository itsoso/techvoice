from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import verify_password
from app.models import Executive, Tenant, TenantAdmin
from app.models.enums import ExecutiveApprovalStatus


def get_tenant_admin(db: Session, tenant_slug: str, username: str) -> TenantAdmin:
    tenant = db.scalar(select(Tenant).where(Tenant.slug == tenant_slug))
    if tenant is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="tenant not found")

    admin = db.scalar(select(TenantAdmin).where(TenantAdmin.tenant_id == tenant.id, TenantAdmin.username == username))
    if admin is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid credentials")
    return admin


def authenticate_tenant_admin(db: Session, tenant_slug: str, username: str, password: str) -> TenantAdmin:
    admin = get_tenant_admin(db, tenant_slug, username)
    if not admin.is_active or not verify_password(password, admin.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid credentials")
    return admin


def list_tenant_executives(db: Session, tenant_id: int) -> list[Executive]:
    return list(db.scalars(select(Executive).where(Executive.tenant_id == tenant_id).order_by(Executive.created_at.desc())).all())


def approve_executive(db: Session, tenant_id: int, executive_id: int) -> Executive:
    executive = db.scalar(select(Executive).where(Executive.tenant_id == tenant_id, Executive.id == executive_id))
    if executive is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="executive not found")
    executive.approval_status = ExecutiveApprovalStatus.APPROVED
    db.commit()
    db.refresh(executive)
    return executive
