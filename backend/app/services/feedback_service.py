from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.enums import ActorType, EventType, FeedbackStatus
from app.models.feedback import Feedback
from app.models.feedback_event import FeedbackEvent
from app.models.star import Star
from app.schemas.feedback import AdminReplyCreate, FeedbackCreate, FeedbackReplyCreate, FeedbackStatusUpdate
from app.services.moderation import ensure_safe_content
from app.services.thread_codes import generate_public_code, generate_thread_code


def create_feedback(db: Session, payload: FeedbackCreate) -> Feedback:
    ensure_safe_content(
        payload.title,
        payload.content_markdown,
        payload.proposal_problem,
        payload.proposal_impact,
        payload.proposal_suggestion,
    )

    feedback = Feedback(
        thread_code=generate_thread_code(),
        public_code=generate_public_code(),
        type=payload.type,
        title=payload.title,
        content_markdown=payload.content_markdown,
        proposal_problem=payload.proposal_problem,
        proposal_impact=payload.proposal_impact,
        proposal_suggestion=payload.proposal_suggestion,
        category=payload.category,
    )
    db.add(feedback)
    db.flush()

    db.add(
        FeedbackEvent(
            feedback_id=feedback.id,
            actor_type=ActorType.SYSTEM,
            event_type=EventType.SUBMITTED,
            content="你的声音已加密送达",
        )
    )
    db.commit()
    db.refresh(feedback)
    return feedback


def get_feedback_by_thread_code(db: Session, thread_code: str) -> Feedback:
    feedback = db.scalar(
        select(Feedback)
        .options(selectinload(Feedback.events))
        .where(Feedback.thread_code == thread_code)
    )
    if feedback is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="thread not found")
    return feedback


def create_employee_reply(db: Session, thread_code: str, payload: FeedbackReplyCreate) -> Feedback:
    ensure_safe_content(payload.content)

    feedback = get_feedback_by_thread_code(db, thread_code)
    if feedback.status == FeedbackStatus.NEEDS_INFO:
        feedback.status = FeedbackStatus.REVIEWING

    db.add(
        FeedbackEvent(
            feedback_id=feedback.id,
            actor_type=ActorType.EMPLOYEE,
            event_type=EventType.REPLY,
            content=payload.content,
        )
    )
    db.commit()
    db.refresh(feedback)
    return feedback


def list_feedbacks(db: Session) -> list[Feedback]:
    return list(db.scalars(select(Feedback).order_by(Feedback.created_at.desc())).all())


def get_feedback_by_id(db: Session, feedback_id: int) -> Feedback:
    feedback = db.scalar(
        select(Feedback)
        .options(selectinload(Feedback.events))
        .where(Feedback.id == feedback_id)
    )
    if feedback is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="feedback not found")
    return feedback


def get_feedback_by_public_code(db: Session, public_code: str) -> Feedback:
    feedback = db.scalar(
        select(Feedback)
        .options(selectinload(Feedback.events))
        .where(Feedback.public_code == public_code)
    )
    if feedback is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="feedback not found")
    return feedback


def update_feedback_status(db: Session, feedback_id: int, payload: FeedbackStatusUpdate) -> Feedback:
    feedback = get_feedback_by_id(db, feedback_id)
    feedback.status = payload.status
    db.add(
        FeedbackEvent(
            feedback_id=feedback.id,
            actor_type=ActorType.ADMIN,
            event_type=EventType.STATUS_CHANGED,
            content=payload.reason,
            meta_json={"status": payload.status.value},
        )
    )
    db.commit()
    db.refresh(feedback)
    return feedback


def create_admin_reply(db: Session, feedback_id: int, payload: AdminReplyCreate) -> Feedback:
    ensure_safe_content(payload.content)

    feedback = get_feedback_by_id(db, feedback_id)
    db.add(
        FeedbackEvent(
            feedback_id=feedback.id,
            actor_type=ActorType.ADMIN,
            event_type=EventType.REPLY,
            content=payload.content,
        )
    )
    db.commit()
    db.refresh(feedback)
    return feedback


def publish_feedback(db: Session, feedback_id: int) -> Feedback:
    feedback = get_feedback_by_id(db, feedback_id)
    feedback.is_public = True
    feedback.status = FeedbackStatus.PUBLISHED
    db.add(
        FeedbackEvent(
            feedback_id=feedback.id,
            actor_type=ActorType.ADMIN,
            event_type=EventType.PUBLISHED,
            content="已公开到回音壁",
        )
    )
    db.commit()
    db.refresh(feedback)
    return feedback


def hide_feedback(db: Session, feedback_id: int) -> Feedback:
    feedback = get_feedback_by_id(db, feedback_id)
    feedback.is_public = False
    feedback.status = FeedbackStatus.HIDDEN
    db.add(
        FeedbackEvent(
            feedback_id=feedback.id,
            actor_type=ActorType.ADMIN,
            event_type=EventType.HIDDEN,
            content="已从回音壁撤回",
        )
    )
    db.commit()
    db.refresh(feedback)
    return feedback


def hide_feedback_by_public_code(db: Session, public_code: str) -> Feedback:
    feedback = get_feedback_by_public_code(db, public_code)
    if not feedback.is_public:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="feedback is already hidden")
    return hide_feedback(db, feedback.id)


def restore_feedback(db: Session, feedback_id: int) -> Feedback:
    feedback = get_feedback_by_id(db, feedback_id)
    feedback.is_public = True
    feedback.status = FeedbackStatus.PUBLISHED
    db.add(
        FeedbackEvent(
            feedback_id=feedback.id,
            actor_type=ActorType.ADMIN,
            event_type=EventType.RESTORED,
            content="已恢复公开到回音壁",
        )
    )
    db.commit()
    db.refresh(feedback)
    return feedback


def list_public_feedbacks(db: Session) -> list[Feedback]:
    return list(
        db.scalars(
            select(Feedback)
            .options(selectinload(Feedback.events))
            .where(Feedback.is_public.is_(True))
            .order_by(Feedback.star_count.desc(), Feedback.created_at.desc())
        ).all()
    )


def star_feedback(db: Session, public_code: str, fingerprint: str):
    feedback = db.scalar(select(Feedback).where(Feedback.public_code == public_code, Feedback.is_public.is_(True)))
    if feedback is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="feedback not found")

    star = Star(feedback_id=feedback.id, client_fingerprint=fingerprint)
    db.add(star)
    feedback.star_count += 1
    db.add(
        FeedbackEvent(
            feedback_id=feedback.id,
            actor_type=ActorType.SYSTEM,
            event_type=EventType.STARRED,
            content=None,
        )
    )
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="already starred") from exc

    db.refresh(feedback)
    from app.schemas.feedback import StarResponse

    return StarResponse(star_count=feedback.star_count)
