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


def test_public_feedbacks_include_full_content_and_admin_replies(client: TestClient, seeded_admin) -> None:
    create_response = client.post(
        "/api/v1/feedbacks",
        json={
            "type": "proposal",
            "category": "engineering_process",
            "proposal_problem": "发布窗口和联调排期经常冲突。",
            "proposal_impact": "需求上线节奏反复被打断，跨团队沟通成本变高。",
            "proposal_suggestion": "统一在周三冻结需求并提前一天确认联调资源。",
        },
    )
    assert create_response.status_code == 201

    listing = client.get("/api/v1/admin/feedbacks", headers=admin_headers(client))
    assert listing.status_code == 200
    feedback_id = listing.json()["items"][0]["id"]

    reply_response = client.post(
        f"/api/v1/admin/feedbacks/{feedback_id}/reply",
        headers=admin_headers(client),
        json={"content": "已经安排负责人评估这个流程调整。"},
    )
    assert reply_response.status_code == 201

    publish_response = client.post(
        f"/api/v1/admin/feedbacks/{feedback_id}/publish",
        headers=admin_headers(client),
    )
    assert publish_response.status_code == 200

    response = client.get("/api/v1/public/feedbacks")

    assert response.status_code == 200
    item = response.json()["items"][0]
    assert item["proposal_problem"] == "发布窗口和联调排期经常冲突。"
    assert item["proposal_impact"] == "需求上线节奏反复被打断，跨团队沟通成本变高。"
    assert item["proposal_suggestion"] == "统一在周三冻结需求并提前一天确认联调资源。"
    assert item["admin_replies"] == [
        {
            "content": "已经安排负责人评估这个流程调整。",
            "created_at": item["admin_replies"][0]["created_at"],
        }
    ]


def test_public_feedbacks_include_employee_follow_up_replies(client: TestClient, seeded_admin) -> None:
    create_response = client.post(
        "/api/v1/feedbacks",
        json={
            "type": "vent",
            "category": "engineering_process",
            "content_markdown": "建议把 CI 结果更早同步给研发。",
        },
    )
    assert create_response.status_code == 201
    thread_code = create_response.json()["thread_code"]

    listing = client.get("/api/v1/admin/feedbacks", headers=admin_headers(client))
    assert listing.status_code == 200
    feedback_id = listing.json()["items"][0]["id"]

    reply_response = client.post(
        f"/api/v1/admin/feedbacks/{feedback_id}/reply",
        headers=admin_headers(client),
        json={"content": "已经安排平台团队评估。"},
    )
    assert reply_response.status_code == 201

    employee_reply = client.post(
        f"/api/v1/feedbacks/{thread_code}/replies",
        json={"content": "补充一点，主要卡在 KDev 链路。"},
    )
    assert employee_reply.status_code == 201

    publish_response = client.post(
        f"/api/v1/admin/feedbacks/{feedback_id}/publish",
        headers=admin_headers(client),
    )
    assert publish_response.status_code == 200

    response = client.get("/api/v1/public/feedbacks")

    assert response.status_code == 200
    item = response.json()["items"][0]
    assert item["employee_replies"] == [
        {
            "content": "补充一点，主要卡在 KDev 链路。",
            "created_at": item["employee_replies"][0]["created_at"],
        }
    ]
