from app.core.config import Settings


def test_settings_default_database_url_uses_sqlite() -> None:
    settings = Settings()

    assert settings.database_url.endswith("techvoice.db")
