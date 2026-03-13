from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_executive
from app.core.security import create_access_token
from app.db.session import get_db
from app.models import Executive
from app.schemas.admin import TokenResponse
from app.schemas.executive import (
    ExecutiveLoginRequest,
    ExecutiveRead,
    ExecutiveRegisterRequest,
    QueueItemRead,
    QueueListResponse,
)
from app.schemas.lounge import LoungeSessionClaimResponse
from app.services.executive_service import authenticate_executive, register_executive
from app.services.lounge_connections import lounge_connection_manager
from app.services.lounge_service import claim_lounge_session, get_waiting_sessions_for_executive

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
    db: Session = Depends(get_db),
) -> QueueListResponse:
    if executive.tenant.slug != tenant_slug:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="tenant mismatch")
    items = get_waiting_sessions_for_executive(db, executive)
    return QueueListResponse(
        items=[
            QueueItemRead(
                session_id=item.id,
                event_id=item.event_id,
                alias_label=item.ticket.alias_label,
                entered_at=item.ticket.entered_at,
                created_at=item.created_at,
            )
            for item in items
        ]
    )


@router.post("/tenants/{tenant_slug}/executive/lounge-sessions/{session_id}/claim", response_model=LoungeSessionClaimResponse)
async def claim_lounge_session_route(
    tenant_slug: str,
    session_id: int,
    executive: Executive = Depends(get_current_executive),
    db: Session = Depends(get_db),
) -> LoungeSessionClaimResponse:
    if executive.tenant.slug != tenant_slug:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="tenant mismatch")
    session = claim_lounge_session(db, tenant_slug, session_id, executive)
    await lounge_connection_manager.notify_session_claimed(session.id, executive)
    return LoungeSessionClaimResponse(session_id=session.id, status=session.status.value)
