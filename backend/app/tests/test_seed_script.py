from app.scripts.seed import default_admin_payload


def test_default_admin_username_is_admin() -> None:
    assert default_admin_payload()["username"] == "admin"
