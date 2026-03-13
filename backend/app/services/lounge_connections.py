from __future__ import annotations

from collections import defaultdict

from fastapi import WebSocket

from app.models import Executive


class LoungeConnectionManager:
    def __init__(self) -> None:
        self._participant_sockets: dict[int, set[WebSocket]] = defaultdict(set)
        self._executive_sockets: dict[int, set[WebSocket]] = defaultdict(set)

    async def connect_participant(self, session_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        self._participant_sockets[session_id].add(websocket)

    async def connect_executive(self, executive_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        self._executive_sockets[executive_id].add(websocket)

    def disconnect_participant(self, session_id: int, websocket: WebSocket) -> None:
        sockets = self._participant_sockets.get(session_id)
        if not sockets:
            return
        sockets.discard(websocket)
        if not sockets:
            self._participant_sockets.pop(session_id, None)

    def disconnect_executive(self, executive_id: int, websocket: WebSocket) -> None:
        sockets = self._executive_sockets.get(executive_id)
        if not sockets:
            return
        sockets.discard(websocket)
        if not sockets:
            self._executive_sockets.pop(executive_id, None)

    async def notify_waiting(self, session_id: int, alias_label: str) -> None:
        await self._broadcast(
            self._participant_sockets.get(session_id, set()),
            {
                "type": "waiting",
                "session_id": session_id,
                "alias_label": alias_label,
            },
        )

    async def notify_session_claimed(self, session_id: int, executive: Executive) -> None:
        await self._broadcast(
            self._participant_sockets.get(session_id, set()),
            {
                "type": "session_claimed",
                "session_id": session_id,
                "executive_id": executive.id,
                "executive_name": executive.name,
            },
        )

    async def send_to_participant(self, session_id: int, payload: dict) -> None:
        await self._broadcast(self._participant_sockets.get(session_id, set()), payload)

    async def send_to_executive(self, executive_id: int, payload: dict) -> None:
        await self._broadcast(self._executive_sockets.get(executive_id, set()), payload)

    async def _broadcast(self, sockets: set[WebSocket], payload: dict) -> None:
        stale: list[WebSocket] = []
        for websocket in sockets:
            try:
                await websocket.send_json(payload)
            except Exception:
                stale.append(websocket)
        for websocket in stale:
            sockets.discard(websocket)


lounge_connection_manager = LoungeConnectionManager()
