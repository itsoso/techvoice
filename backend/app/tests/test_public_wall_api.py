from fastapi.testclient import TestClient


def admin_headers(client: TestClient) -> dict[str, str]:
    response = client.post(
        "/api/v1/admin/auth/login",
        json={"username": "admin", "password": "admin123456"},
    )
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def create_feedback(client: TestClient) -> int:
    create_response = client.post(
        "/api/v1/feedbacks",
        json={
            "type": "vent",
            "category": "engineering_process",
            "content_markdown": "这个建议适合进入公开回音壁。",
        },
    )
    assert create_response.status_code == 201

    listing = client.get("/api/v1/admin/feedbacks", headers=admin_headers(client))
    assert listing.status_code == 200
    return listing.json()["items"][0]["id"]


def test_star_public_feedback_increments_counter_once(
    client: TestClient,
    seeded_admin,
) -> None:
    feedback_id = create_feedback(client)

    publish_response = client.post(
        f"/api/v1/admin/feedbacks/{feedback_id}/publish",
        headers=admin_headers(client),
    )
    assert publish_response.status_code == 200

    public_code = publish_response.json()["public_code"]

    response = client.post(
        f"/api/v1/public/feedbacks/{public_code}/star",
        headers={"x-star-token": "test-device"},
    )
    assert response.status_code == 201

    second = client.post(
        f"/api/v1/public/feedbacks/{public_code}/star",
        headers={"x-star-token": "test-device"},
    )
    assert second.status_code == 409


def test_public_feedbacks_lists_published_items(client: TestClient, seeded_admin) -> None:
    feedback_id = create_feedback(client)
    publish_response = client.post(
        f"/api/v1/admin/feedbacks/{feedback_id}/publish",
        headers=admin_headers(client),
    )
    assert publish_response.status_code == 200

    response = client.get("/api/v1/public/feedbacks")

    assert response.status_code == 200
    assert len(response.json()["items"]) == 1
