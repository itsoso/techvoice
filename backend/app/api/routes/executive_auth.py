from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_executive
from app.core.security import create_access_token
from app.db.session import get_db
from app.models import Executive
from app.schemas.admin import TokenResponse
from app.schemas.executive import ExecutiveLoginRequest, ExecutiveRead, ExecutiveRegisterRequest, QueueListResponse
from app.services.executive_service import authenticate_executive, register_executive

router = APIRouter(tags=["executive-auth"])


@router.post("/tenants/{tenant_slug}/executives/register", response_model=ExecutiveRead, status_code=201)
def register_executive_route(
    tenant_slug: str,
    payload: ExecutiveRegisterRequest,
    db: Session = Depends(get_db),
) -> ExecutiveRead:
    executive = register_executive(db, tenant_slug, payload)
    return ExecutiveRead.model_validate(executive)


@router.post("/tenants/{tenant_slug}/executives/login", response_model=TokenResponse)
def executive_login_route(
    tenant_slug: str,
    payload: ExecutiveLoginRequest,
    db: Session = Depends(get_db),
) -> TokenResponse:
    executive = authenticate_executive(db, tenant_slug, payload.email, payload.password)
    token = create_access_token(
        subject=f"executive:{executive.id}",
        extra_claims={"role": "executive", "tenant": tenant_slug},
    )
    return TokenResponse(access_token=token)


@router.get("/tenants/{tenant_slug}/executive/lounge-queue", response_model=QueueListResponse)
def executive_queue_route(
    tenant_slug: str,
    executive: Executive = Depends(get_current_executive),
) -> QueueListResponse:
    if executive.tenant.slug != tenant_slug:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="tenant mismatch")
    return QueueListResponse(items=[])
