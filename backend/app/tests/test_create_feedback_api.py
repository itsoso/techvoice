from fastapi.testclient import TestClient


def test_create_vent_feedback_returns_thread_code(client: TestClient) -> None:
    payload = {
        "type": "vent",
        "category": "engineering_process",
        "content_markdown": "CI 流水线经常在高峰期卡住。",
    }

    response = client.post("/api/v1/feedbacks", json=payload)

    assert response.status_code == 201
    assert response.json()["thread_code"].startswith("ECH-")
