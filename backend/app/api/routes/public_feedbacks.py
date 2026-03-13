from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.enums import ActorType, EventType
from app.models.feedback import Feedback
from app.schemas.feedback import (
    PublicAdminReplyRead,
    PublicFeedbackListResponse,
    PublicFeedbackRead,
    StarResponse,
)
from app.services.feedback_service import list_public_feedbacks, star_feedback

router = APIRouter(tags=["public-feedbacks"])


def serialize_public_feedback(feedback: Feedback) -> PublicFeedbackRead:
    admin_replies = [
        PublicAdminReplyRead(content=event.content, created_at=event.created_at)
        for event in feedback.events
        if event.actor_type == ActorType.ADMIN and event.event_type == EventType.REPLY and event.content
    ]

    return PublicFeedbackRead(
        public_code=feedback.public_code,
        type=feedback.type,
        category=feedback.category,
        status=feedback.status,
        title=feedback.title,
        content_markdown=feedback.content_markdown,
        proposal_problem=feedback.proposal_problem,
        proposal_impact=feedback.proposal_impact,
        proposal_suggestion=feedback.proposal_suggestion,
        admin_replies=admin_replies,
        star_count=feedback.star_count,
        created_at=feedback.created_at,
    )


@router.get("/public/feedbacks", response_model=PublicFeedbackListResponse)
def list_public_feedbacks_route(db: Session = Depends(get_db)) -> PublicFeedbackListResponse:
    items = list_public_feedbacks(db)
    return PublicFeedbackListResponse(items=[serialize_public_feedback(item) for item in items])


@router.post(
    "/public/feedbacks/{public_code}/star",
    response_model=StarResponse,
    status_code=status.HTTP_201_CREATED,
)
def star_public_feedback_route(
    public_code: str,
    request: Request,
    db: Session = Depends(get_db),
) -> StarResponse:
    fingerprint = request.headers.get("x-star-token") or request.client.host or "anonymous"
    return star_feedback(db, public_code, fingerprint)
