import pytest
import bcrypt
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models import Admin, Feedback, FeedbackEvent, Star


@pytest.fixture
def db_session(tmp_path) -> Session:
    engine = create_engine(
        f"sqlite:///{tmp_path / 'test.db'}",
        connect_args={"check_same_thread": False},
    )
    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, class_=Session)
    Base.metadata.create_all(bind=engine)

    try:
        with TestingSessionLocal() as session:
            yield session
    finally:
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client(db_session: Session) -> TestClient:
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture
def seeded_admin(db_session: Session) -> Admin:
    admin = Admin(
        username="admin",
        password_hash=bcrypt.hashpw("admin123456".encode("utf-8"), bcrypt.gensalt()).decode("utf-8"),
        display_name="TechVoice Admin",
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)
    return admin
