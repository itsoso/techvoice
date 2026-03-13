from fastapi import APIRouter, Depends, Header, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.lounge import LoungeEnterRequest, LoungeEnterResponse, LoungeEventRead, LoungeTicketClaimResponse
from app.services.lounge_service import claim_lounge_ticket, enter_lounge, get_current_lounge_event

router = APIRouter(tags=["lounge-public"])


@router.get("/tenants/{tenant_slug}/lounge-events/current", response_model=LoungeEventRead)
def get_current_lounge_event_route(
    tenant_slug: str,
    db: Session = Depends(get_db),
) -> LoungeEventRead:
    event = get_current_lounge_event(db, tenant_slug)
    return LoungeEventRead.model_validate(event)


@router.post(
    "/tenants/{tenant_slug}/lounge-events/{event_id}/claim-ticket",
    response_model=LoungeTicketClaimResponse,
    status_code=status.HTTP_201_CREATED,
)
def claim_lounge_ticket_route(
    tenant_slug: str,
    event_id: int,
    db: Session = Depends(get_db),
    x_lounge_fingerprint: str = Header(...),
) -> LoungeTicketClaimResponse:
    ticket, entry_token = claim_lounge_ticket(db, tenant_slug, event_id, x_lounge_fingerprint)
    return LoungeTicketClaimResponse(
        ticket_code=ticket.ticket_code,
        entry_token=entry_token,
        alias_label=ticket.alias_label,
    )


@router.post("/tenants/{tenant_slug}/lounge-events/{event_id}/enter", response_model=LoungeEnterResponse)
def enter_lounge_route(
    tenant_slug: str,
    event_id: int,
    payload: LoungeEnterRequest,
    db: Session = Depends(get_db),
    x_lounge_fingerprint: str = Header(...),
) -> LoungeEnterResponse:
    ticket, session = enter_lounge(db, tenant_slug, event_id, x_lounge_fingerprint, payload)
    return LoungeEnterResponse(ticket_code=ticket.ticket_code, alias_label=ticket.alias_label, session_id=session.id)
