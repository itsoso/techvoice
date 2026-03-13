from fastapi.testclient import TestClient


def test_admin_login_returns_access_token(client: TestClient, seeded_admin) -> None:
    response = client.post(
        "/api/v1/admin/auth/login",
        json={"username": "admin", "password": "admin123456"},
    )

    assert response.status_code == 200
    assert "access_token" in response.json()
