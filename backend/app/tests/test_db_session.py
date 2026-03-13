from app.db.session import build_engine_kwargs
from app.core.config import Settings


def test_settings_default_database_url_uses_sqlite() -> None:
    settings = Settings()

    assert settings.database_url.endswith("techvoice.db")


def test_build_engine_kwargs_adds_sqlite_connect_args() -> None:
    kwargs = build_engine_kwargs("sqlite:///./techvoice.db")

    assert kwargs == {"connect_args": {"check_same_thread": False}}


def test_build_engine_kwargs_skips_sqlite_only_args_for_postgres() -> None:
    kwargs = build_engine_kwargs("postgresql+psycopg://user:pass@db/techvoice")

    assert kwargs == {}
