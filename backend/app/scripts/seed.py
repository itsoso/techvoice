from sqlalchemy import select

from app.core.security import hash_password
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models.admin import Admin


def default_admin_payload() -> dict[str, str]:
    return {
        "username": "admin",
        "password": "admin123456",
        "display_name": "TechVoice Admin",
    }


def seed_default_admin() -> None:
    payload = default_admin_payload()
    Base.metadata.create_all(bind=engine)

    with SessionLocal() as session:
        existing = session.scalar(select(Admin).where(Admin.username == payload["username"]))
        if existing is not None:
            return

        session.add(
            Admin(
                username=payload["username"],
                password_hash=hash_password(payload["password"]),
                display_name=payload["display_name"],
            )
        )
        session.commit()


if __name__ == "__main__":
    seed_default_admin()
