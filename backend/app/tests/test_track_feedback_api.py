from fastapi.testclient import TestClient


def create_feedback(client: TestClient) -> str:
    response = client.post(
        "/api/v1/feedbacks",
        json={
            "type": "vent",
            "category": "engineering_process",
            "content_markdown": "流水线排队问题需要补充。",
        },
    )
    assert response.status_code == 201
    return response.json()["thread_code"]


def test_reply_to_thread_appends_employee_event(client: TestClient) -> None:
    thread_code = create_feedback(client)

    response = client.post(
        f"/api/v1/feedbacks/{thread_code}/replies",
        json={"content": "可以补充更多失败场景。"},
    )

    assert response.status_code == 201

    detail = client.get(f"/api/v1/feedbacks/{thread_code}")
    assert detail.status_code == 200
    assert detail.json()["events"][-1]["actor_type"] == "employee"
