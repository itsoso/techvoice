from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models import Executive, Tenant
from app.models.enums import ExecutiveApprovalStatus
from app.schemas.executive import ExecutiveRegisterRequest


def get_tenant_or_404(db: Session, tenant_slug: str) -> Tenant:
    tenant = db.scalar(select(Tenant).where(Tenant.slug == tenant_slug))
    if tenant is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="tenant not found")
    return tenant


def register_executive(db: Session, tenant_slug: str, payload: ExecutiveRegisterRequest) -> Executive:
    tenant = get_tenant_or_404(db, tenant_slug)
    existing = db.scalar(select(Executive).where(Executive.tenant_id == tenant.id, Executive.email == payload.email))
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="executive already registered")

    executive = Executive(
        tenant_id=tenant.id,
        name=payload.name,
        email=payload.email,
        title=payload.title,
        password_hash=hash_password(payload.password),
    )
    db.add(executive)
    db.commit()
    db.refresh(executive)
    return executive


def authenticate_executive(db: Session, tenant_slug: str, email: str, password: str) -> Executive:
    tenant = get_tenant_or_404(db, tenant_slug)
    executive = db.scalar(select(Executive).where(Executive.tenant_id == tenant.id, Executive.email == email))
    if executive is None or not verify_password(password, executive.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid credentials")
    if executive.approval_status != ExecutiveApprovalStatus.APPROVED:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="executive approval pending")
    return executive
