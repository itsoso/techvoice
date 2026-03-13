from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.routes.admin_auth import router as admin_auth_router
from app.api.routes.admin_feedbacks import router as admin_feedbacks_router
from app.api.routes.feedbacks import router as feedback_router
from app.api.routes.public_feedbacks import router as public_feedbacks_router
from app.db.base import Base
from app.db.session import engine
from app.models import Admin, Feedback, FeedbackEvent, Star


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(lifespan=lifespan)
app.include_router(admin_auth_router, prefix="/api/v1")
app.include_router(admin_feedbacks_router, prefix="/api/v1")
app.include_router(feedback_router, prefix="/api/v1")
app.include_router(public_feedbacks_router, prefix="/api/v1")


@app.get("/api/v1/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
