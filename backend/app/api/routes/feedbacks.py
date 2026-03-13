from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.feedback import (
    FeedbackCreate,
    FeedbackCreateResponse,
    FeedbackDetail,
    FeedbackReplyCreate,
    FeedbackReplyResponse,
)
from app.services.feedback_service import create_employee_reply, create_feedback, get_feedback_by_thread_code

router = APIRouter(tags=["feedbacks"])


@router.post("/feedbacks", response_model=FeedbackCreateResponse, status_code=status.HTTP_201_CREATED)
def create_feedback_route(payload: FeedbackCreate, db: Session = Depends(get_db)) -> FeedbackCreateResponse:
    feedback = create_feedback(db, payload)
    return FeedbackCreateResponse(thread_code=feedback.thread_code)


@router.get("/feedbacks/{thread_code}", response_model=FeedbackDetail)
def get_feedback_route(thread_code: str, db: Session = Depends(get_db)) -> FeedbackDetail:
    feedback = get_feedback_by_thread_code(db, thread_code)
    return FeedbackDetail.model_validate(feedback)


@router.post(
    "/feedbacks/{thread_code}/replies",
    response_model=FeedbackReplyResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_feedback_reply_route(
    thread_code: str,
    payload: FeedbackReplyCreate,
    db: Session = Depends(get_db),
) -> FeedbackReplyResponse:
    create_employee_reply(db, thread_code, payload)
    return FeedbackReplyResponse()
