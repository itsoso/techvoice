from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.feedback import PublicFeedbackListResponse, PublicFeedbackRead, StarResponse
from app.services.feedback_service import list_public_feedbacks, star_feedback

router = APIRouter(tags=["public-feedbacks"])


@router.get("/public/feedbacks", response_model=PublicFeedbackListResponse)
def list_public_feedbacks_route(db: Session = Depends(get_db)) -> PublicFeedbackListResponse:
    items = list_public_feedbacks(db)
    return PublicFeedbackListResponse(items=[PublicFeedbackRead.model_validate(item) for item in items])


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
