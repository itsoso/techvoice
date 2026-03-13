from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models import Executive
from app.models.enums import LoungeSessionStatus
from app.services.lounge_connections import lounge_connection_manager
from app.services.lounge_service import (
    close_lounge_session,
    create_executive_message,
    create_participant_message,
    get_executive_session_for_message,
    get_participant_session,
)

router = APIRouter(tags=["lounge-ws"])


def get_executive_from_ws_token(db: Session, tenant_slug: str, access_token: str) -> Executive | None:
    try:
        payload = decode_access_token(access_token)
    except Exception:
        return None

    if payload.get("role") != "executive":
        return None

    subject = payload.get("sub", "")
    if not subject.startswith("executive:"):
        return None

    executive_id = int(subject.split(":", 1)[1])
    executive = db.scalar(select(Executive).where(Executive.id == executive_id))
    if executive is None or not executive.is_active or executive.tenant.slug != tenant_slug:
        return None
    return executive


@router.websocket("/ws/tenants/{tenant_slug}/lounge-events/{event_id}/participant")
async def participant_room_socket(
    websocket: WebSocket,
    tenant_slug: str,
    event_id: int,
    ticket_code: str,
    entry_token: str,
    db: Session = Depends(get_db),
) -> None:
    try:
        session = get_participant_session(db, tenant_slug, event_id, ticket_code, entry_token)
    except Exception:
        await websocket.close(code=4404)
        return

    await lounge_connection_manager.connect_participant(session.id, websocket)
    try:
        if session.status == LoungeSessionStatus.ACTIVE and session.executive is not None:
            await lounge_connection_manager.send_to_participant(
                session.id,
                {
                    "type": "session_claimed",
                    "session_id": session.id,
                    "executive_id": session.executive.id,
                    "executive_name": session.executive.name,
                },
            )
        else:
            await lounge_connection_manager.notify_waiting(session.id, session.ticket.alias_label)

        while True:
            payload = await websocket.receive_json()
            if payload.get("type") != "send_message":
                continue
            content = str(payload.get("content", "")).strip()
            if not content:
                continue
            try:
                message = create_participant_message(db, session.id, content)
            except HTTPException as exc:
                if exc.detail == "event is not live":
                    close_lounge_session(db, session)
                    await websocket.send_json({"type": "event_closed", "session_id": session.id})
                    await websocket.close()
                    break
                raise
            session = message.session
            if session.executive_id is not None:
                await lounge_connection_manager.send_to_executive(
                    session.executive_id,
                    {
                        "type": "message_sent",
                        "session_id": session.id,
                        "sender_type": message.sender_type.value,
                        "sender_label": message.sender_label,
                        "content": message.content,
                    },
                )
    except WebSocketDisconnect:
        lounge_connection_manager.disconnect_participant(session.id, websocket)


@router.websocket("/ws/tenants/{tenant_slug}/executive/lounge")
async def executive_lounge_socket(
    websocket: WebSocket,
    tenant_slug: str,
    access_token: str,
    db: Session = Depends(get_db),
) -> None:
    executive = get_executive_from_ws_token(db, tenant_slug, access_token)
    if executive is None:
        await websocket.close(code=4401)
        return

    await lounge_connection_manager.connect_executive(executive.id, websocket)
    try:
        await websocket.send_json({"type": "connected", "executive_id": executive.id, "name": executive.name})
        while True:
            payload = await websocket.receive_json()
            if payload.get("type") != "send_message":
                continue
            content = str(payload.get("content", "")).strip()
            if not content:
                continue
            session_id = int(payload.get("session_id", 0))
            try:
                session = get_executive_session_for_message(db, executive, session_id)
                message = create_executive_message(db, session, executive, content)
            except HTTPException as exc:
                if exc.detail == "event is not live":
                    await websocket.send_json({"type": "event_closed", "session_id": session_id})
                    await websocket.close()
                    break
                raise
            await lounge_connection_manager.send_to_participant(
                session.id,
                {
                    "type": "message_sent",
                    "session_id": session.id,
                    "sender_type": message.sender_type.value,
                    "sender_label": message.sender_label,
                    "content": message.content,
                },
            )
    except WebSocketDisconnect:
        lounge_connection_manager.disconnect_executive(executive.id, websocket)
