from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_admin
from app.db.session import get_db
from app.models.admin import Admin
from app.schemas.feedback import (
    AdminReplyCreate,
    FeedbackDetail,
    FeedbackListResponse,
    FeedbackStatusUpdate,
    FeedbackSummaryRead,
)
from app.services.feedback_service import (
    create_admin_reply,
    get_feedback_by_id,
    list_feedbacks,
    publish_feedback,
    update_feedback_status,
)

router = APIRouter(tags=["admin-feedbacks"])


@router.get("/admin/feedbacks", response_model=FeedbackListResponse)
def list_feedbacks_route(
    _: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> FeedbackListResponse:
    items = list_feedbacks(db)
    return FeedbackListResponse(items=[FeedbackSummaryRead.model_validate(item) for item in items])


@router.post("/admin/feedbacks/{feedback_id}/status", response_model=FeedbackSummaryRead)
def update_feedback_status_route(
    feedback_id: int,
    payload: FeedbackStatusUpdate,
    _: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> FeedbackSummaryRead:
    feedback = update_feedback_status(db, feedback_id, payload)
    return FeedbackSummaryRead.model_validate(feedback)


@router.get("/admin/feedbacks/{feedback_id}", response_model=FeedbackDetail)
def get_feedback_detail_route(
    feedback_id: int,
    _: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> FeedbackDetail:
    feedback = get_feedback_by_id(db, feedback_id)
    return FeedbackDetail.model_validate(feedback)


@router.post("/admin/feedbacks/{feedback_id}/reply", status_code=201)
def create_admin_reply_route(
    feedback_id: int,
    payload: AdminReplyCreate,
    _: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> dict[str, bool]:
    create_admin_reply(db, feedback_id, payload)
    return {"created": True}


@router.post("/admin/feedbacks/{feedback_id}/publish", response_model=FeedbackSummaryRead)
def publish_feedback_route(
    feedback_id: int,
    _: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> FeedbackSummaryRead:
    feedback = publish_feedback(db, feedback_id)
    return FeedbackSummaryRead.model_validate(feedback)
