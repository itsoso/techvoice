from typing import Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.deps import get_current_admin
from app.db.session import get_db
from app.models.admin import Admin
from app.models.enums import FeedbackStatus
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
    hide_feedback,
    hide_feedback_by_public_code,
    list_feedbacks,
    publish_feedback,
    restore_feedback,
    update_feedback_status,
)

router = APIRouter(tags=["admin-feedbacks"])


@router.get("/admin/feedbacks", response_model=FeedbackListResponse)
def list_feedbacks_route(
    tab: Literal["unreplied", "processed"] = Query("unreplied"),
    status_filter: Literal["all", "received", "reviewing", "needs_info", "accepted", "deferred", "published", "hidden"] = Query("all", alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    _: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> FeedbackListResponse:
    items, total = list_feedbacks(
        db,
        tab=tab,
        status_filter=None if status_filter == "all" else FeedbackStatus(status_filter),
        page=page,
        page_size=page_size,
    )
    return FeedbackListResponse(
        items=[FeedbackSummaryRead.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
    )


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


@router.post("/admin/feedbacks/{feedback_id}/hide", response_model=FeedbackSummaryRead)
def hide_feedback_route(
    feedback_id: int,
    _: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> FeedbackSummaryRead:
    feedback = hide_feedback(db, feedback_id)
    return FeedbackSummaryRead.model_validate(feedback)


@router.post("/admin/public-feedbacks/{public_code}/hide", response_model=FeedbackSummaryRead)
def hide_public_feedback_route(
    public_code: str,
    _: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> FeedbackSummaryRead:
    feedback = hide_feedback_by_public_code(db, public_code)
    return FeedbackSummaryRead.model_validate(feedback)


@router.post("/admin/feedbacks/{feedback_id}/restore", response_model=FeedbackSummaryRead)
def restore_feedback_route(
    feedback_id: int,
    _: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> FeedbackSummaryRead:
    feedback = restore_feedback(db, feedback_id)
    return FeedbackSummaryRead.model_validate(feedback)
