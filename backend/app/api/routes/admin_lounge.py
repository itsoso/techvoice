from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_tenant_admin
from app.core.security import create_access_token
from app.db.session import get_db
from app.models import TenantAdmin
from app.schemas.admin import AdminLoginRequest, TokenResponse
from app.schemas.executive import ExecutiveListResponse, ExecutiveRead
from app.schemas.lounge import LoungeEventCreateRequest, LoungeEventListResponse, LoungeEventRead
from app.services.lounge_service import create_lounge_event, list_lounge_events_for_tenant
from app.services.tenant_admin_service import approve_executive, authenticate_tenant_admin, list_tenant_executives

router = APIRouter(tags=["admin-lounge"])


@router.post("/tenants/{tenant_slug}/admin/auth/login", response_model=TokenResponse)
def tenant_admin_login_route(
    tenant_slug: str,
    payload: AdminLoginRequest,
    db: Session = Depends(get_db),
) -> TokenResponse:
    admin = authenticate_tenant_admin(db, tenant_slug, payload.username, payload.password)
    token = create_access_token(
        subject=f"tenant_admin:{admin.id}",
        extra_claims={"role": "tenant_admin", "tenant": tenant_slug},
    )
    return TokenResponse(access_token=token)


@router.get("/tenants/{tenant_slug}/admin/executives", response_model=ExecutiveListResponse)
def list_tenant_executives_route(
    tenant_slug: str,
    admin: TenantAdmin = Depends(get_current_tenant_admin),
    db: Session = Depends(get_db),
) -> ExecutiveListResponse:
    if admin.tenant.slug != tenant_slug:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="tenant mismatch")
    items = list_tenant_executives(db, admin.tenant_id)
    return ExecutiveListResponse(items=[ExecutiveRead.model_validate(item) for item in items])


@router.post("/tenants/{tenant_slug}/admin/executives/{executive_id}/approve", response_model=ExecutiveRead)
def approve_tenant_executive_route(
    tenant_slug: str,
    executive_id: int,
    admin: TenantAdmin = Depends(get_current_tenant_admin),
    db: Session = Depends(get_db),
) -> ExecutiveRead:
    if admin.tenant.slug != tenant_slug:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="tenant mismatch")
    executive = approve_executive(db, admin.tenant_id, executive_id)
    return ExecutiveRead.model_validate(executive)


@router.get("/tenants/{tenant_slug}/admin/lounge-events", response_model=LoungeEventListResponse)
def list_lounge_events_route(
    tenant_slug: str,
    admin: TenantAdmin = Depends(get_current_tenant_admin),
    db: Session = Depends(get_db),
) -> LoungeEventListResponse:
    if admin.tenant.slug != tenant_slug:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="tenant mismatch")
    items = list_lounge_events_for_tenant(db, admin.tenant_id)
    return LoungeEventListResponse(items=[LoungeEventRead.model_validate(item) for item in items])


@router.post("/tenants/{tenant_slug}/admin/lounge-events", response_model=LoungeEventRead, status_code=201)
def create_lounge_event_route(
    tenant_slug: str,
    payload: LoungeEventCreateRequest,
    admin: TenantAdmin = Depends(get_current_tenant_admin),
    db: Session = Depends(get_db),
) -> LoungeEventRead:
    if admin.tenant.slug != tenant_slug:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="tenant mismatch")
    event = create_lounge_event(db, admin, payload)
    return LoungeEventRead.model_validate(event)
