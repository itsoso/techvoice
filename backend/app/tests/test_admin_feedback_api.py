from fastapi.testclient import TestClient


def admin_headers(client: TestClient) -> dict[str, str]:
    login_response = client.post(
        "/api/v1/admin/auth/login",
        json={"username": "admin", "password": "admin123456"},
    )
    assert login_response.status_code == 200
    return {"Authorization": f"Bearer {login_response.json()['access_token']}"}


def create_feedback(client: TestClient) -> None:
    response = client.post(
        "/api/v1/feedbacks",
        json={
            "type": "vent",
            "category": "engineering_process",
            "content_markdown": "需要管理员处理的反馈。",
        },
    )
    assert response.status_code == 201


def test_admin_list_feedbacks_returns_created_feedback(
    client: TestClient,
    seeded_admin,
) -> None:
    create_feedback(client)

    response = client.get("/api/v1/admin/feedbacks", headers=admin_headers(client))

    assert response.status_code == 200
    assert len(response.json()["items"]) == 1
    assert response.json()["total"] == 1
    assert response.json()["page"] == 1
    assert response.json()["page_size"] == 10


def test_admin_list_feedbacks_supports_tabs_status_filters_and_pagination(
    client: TestClient,
    seeded_admin,
) -> None:
    create_feedback(client)
    create_feedback(client)
    create_feedback(client)

    listing = client.get("/api/v1/admin/feedbacks", headers=admin_headers(client))
    first_feedback_id = listing.json()["items"][0]["id"]
    second_feedback_id = listing.json()["items"][1]["id"]

    reply_response = client.post(
        f"/api/v1/admin/feedbacks/{first_feedback_id}/reply",
        json={"content": "这条已经处理。"},
        headers=admin_headers(client),
    )
    assert reply_response.status_code == 201

    status_response = client.post(
        f"/api/v1/admin/feedbacks/{second_feedback_id}/status",
        json={"status": "accepted", "reason": "进入排期"},
        headers=admin_headers(client),
    )
    assert status_response.status_code == 200

    unreplied_page = client.get(
        "/api/v1/admin/feedbacks?tab=unreplied&page=1&page_size=1",
        headers=admin_headers(client),
    )
    assert unreplied_page.status_code == 200
    assert unreplied_page.json()["total"] == 1
    assert len(unreplied_page.json()["items"]) == 1

    processed = client.get(
        "/api/v1/admin/feedbacks?tab=processed",
        headers=admin_headers(client),
    )
    assert processed.status_code == 200
    assert processed.json()["total"] == 2

    accepted_only = client.get(
        "/api/v1/admin/feedbacks?tab=processed&status=accepted",
        headers=admin_headers(client),
    )
    assert accepted_only.status_code == 200
    assert accepted_only.json()["total"] == 1
    assert accepted_only.json()["items"][0]["id"] == second_feedback_id


def test_admin_can_update_feedback_status(client: TestClient, seeded_admin) -> None:
    create_feedback(client)
    listing = client.get("/api/v1/admin/feedbacks", headers=admin_headers(client))
    feedback_id = listing.json()["items"][0]["id"]

    response = client.post(
        f"/api/v1/admin/feedbacks/{feedback_id}/status",
        json={"status": "accepted", "reason": "排入下一阶段优化"},
        headers=admin_headers(client),
    )

    assert response.status_code == 200
    assert response.json()["status"] == "accepted"


def test_admin_can_reply_to_feedback(client: TestClient, seeded_admin) -> None:
    create_feedback(client)
    listing = client.get("/api/v1/admin/feedbacks", headers=admin_headers(client))
    feedback_id = listing.json()["items"][0]["id"]

    reply_response = client.post(
        f"/api/v1/admin/feedbacks/{feedback_id}/reply",
        json={"content": "我们已经收到，正在评估。"},
        headers=admin_headers(client),
    )

    assert reply_response.status_code == 201

    detail = client.get(
        f"/api/v1/admin/feedbacks/{feedback_id}",
        headers=admin_headers(client),
    )

    assert detail.status_code == 200
    assert detail.json()["events"][-1]["actor_type"] == "admin"


def test_admin_can_hide_and_restore_published_feedback(client: TestClient, seeded_admin) -> None:
    create_feedback(client)
    listing = client.get("/api/v1/admin/feedbacks", headers=admin_headers(client))
    feedback_id = listing.json()["items"][0]["id"]

    publish_response = client.post(
        f"/api/v1/admin/feedbacks/{feedback_id}/publish",
        headers=admin_headers(client),
    )
    assert publish_response.status_code == 200

    hide_response = client.post(
        f"/api/v1/admin/feedbacks/{feedback_id}/hide",
        headers=admin_headers(client),
    )
    assert hide_response.status_code == 200
    assert hide_response.json()["status"] == "hidden"
    assert hide_response.json()["is_public"] is False

    detail = client.get(
        f"/api/v1/admin/feedbacks/{feedback_id}",
        headers=admin_headers(client),
    )
    assert detail.status_code == 200
    assert detail.json()["events"][-1]["content"] == "已从回音壁撤回"

    restore_response = client.post(
        f"/api/v1/admin/feedbacks/{feedback_id}/restore",
        headers=admin_headers(client),
    )
    assert restore_response.status_code == 200
    assert restore_response.json()["status"] == "published"
    assert restore_response.json()["is_public"] is True
