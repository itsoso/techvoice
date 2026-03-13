# TechVoice MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a front-end/back-end separated Python-stack MVP for anonymous employee feedback, admin triage, and a public wall.

**Architecture:** The back end is a FastAPI service with SQLAlchemy models, Pydantic schemas, JWT admin auth, and SQLite persistence. The front end is a React + Vite + TypeScript SPA using React Router and Tailwind CSS, with the employee-facing design based on the provided `techvoice.html` prototype and additional routes for tracking, admin workflows, and the public wall.

**Tech Stack:** Python 3.13, FastAPI, SQLAlchemy, Alembic, pytest, React, TypeScript, Vite, Tailwind CSS, Vitest, React Testing Library

---

### Task 1: Scaffold the repository layout and toolchain files

**Files:**
- Create: `backend/pyproject.toml`
- Create: `backend/app/__init__.py`
- Create: `backend/app/main.py`
- Create: `backend/app/tests/__init__.py`
- Create: `frontend/package.json`
- Create: `frontend/tsconfig.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/index.html`
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/App.tsx`
- Create: `frontend/src/test/setup.ts`
- Create: `.gitignore`
- Create: `README.md`

**Step 1: Write the failing smoke tests**

```python
# backend/app/tests/test_health.py
from fastapi.testclient import TestClient

from app.main import app


def test_health_endpoint_returns_ok() -> None:
    client = TestClient(app)

    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
```

```tsx
// frontend/src/App.test.tsx
import { render, screen } from "@testing-library/react";

import App from "./App";

it("renders application shell", () => {
  render(<App />);
  expect(screen.getByText(/Echo｜TechVoice/i)).toBeInTheDocument();
});
```

**Step 2: Run tests to verify they fail**

Run: `cd /Users/liqiuhua/work/techvoice/backend && pytest app/tests/test_health.py -v`
Expected: FAIL because `app.main` or `/api/v1/health` does not exist.

Run: `cd /Users/liqiuhua/work/techvoice/frontend && npm test -- --runInBand`
Expected: FAIL because the front-end project files and test script do not exist.

**Step 3: Write the minimal implementation**

```python
# backend/app/main.py
from fastapi import FastAPI

app = FastAPI()


@app.get("/api/v1/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
```

```tsx
// frontend/src/App.tsx
export default function App() {
  return <h1>Echo｜TechVoice</h1>;
}
```

**Step 4: Run tests to verify they pass**

Run: `cd /Users/liqiuhua/work/techvoice/backend && pytest app/tests/test_health.py -v`
Expected: PASS

Run: `cd /Users/liqiuhua/work/techvoice/frontend && npm test -- --runInBand`
Expected: PASS

**Step 5: Commit**

```bash
git add .gitignore README.md backend frontend
git commit -m "chore: scaffold techvoice mvp workspace"
```

### Task 2: Add backend configuration, database session handling, and model base

**Files:**
- Modify: `backend/app/main.py`
- Create: `backend/app/core/config.py`
- Create: `backend/app/db/base.py`
- Create: `backend/app/db/session.py`
- Create: `backend/app/models/__init__.py`
- Create: `backend/app/tests/conftest.py`
- Test: `backend/app/tests/test_db_session.py`

**Step 1: Write the failing test**

```python
from app.core.config import Settings


def test_settings_default_database_url_uses_sqlite() -> None:
    settings = Settings()

    assert settings.database_url.endswith("techvoice.db")
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/liqiuhua/work/techvoice/backend && pytest app/tests/test_db_session.py -v`
Expected: FAIL because `Settings` is undefined.

**Step 3: Write minimal implementation**

```python
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./techvoice.db"
    jwt_secret: str = "dev-secret-change-me"
```

**Step 4: Run test to verify it passes**

Run: `cd /Users/liqiuhua/work/techvoice/backend && pytest app/tests/test_db_session.py -v`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/core/config.py backend/app/db backend/app/models backend/app/tests
git commit -m "feat: add backend settings and database base"
```

### Task 3: Model anonymous feedback and event persistence

**Files:**
- Create: `backend/app/models/admin.py`
- Create: `backend/app/models/feedback.py`
- Create: `backend/app/models/feedback_event.py`
- Create: `backend/app/models/star.py`
- Modify: `backend/app/models/__init__.py`
- Create: `backend/app/schemas/feedback.py`
- Create: `backend/app/services/thread_codes.py`
- Test: `backend/app/tests/test_feedback_models.py`

**Step 1: Write the failing test**

```python
from app.services.thread_codes import generate_thread_code


def test_generate_thread_code_matches_expected_prefix() -> None:
    code = generate_thread_code()

    assert code.startswith("ECH-")
    assert len(code) >= 10
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/liqiuhua/work/techvoice/backend && pytest app/tests/test_feedback_models.py::test_generate_thread_code_matches_expected_prefix -v`
Expected: FAIL because `generate_thread_code` does not exist.

**Step 3: Write minimal implementation**

```python
import secrets


def generate_thread_code() -> str:
    return f"ECH-{secrets.token_hex(3).upper()}"
```

**Step 4: Run test to verify it passes**

Run: `cd /Users/liqiuhua/work/techvoice/backend && pytest app/tests/test_feedback_models.py::test_generate_thread_code_matches_expected_prefix -v`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/models backend/app/schemas/feedback.py backend/app/services/thread_codes.py backend/app/tests/test_feedback_models.py
git commit -m "feat: add feedback persistence models"
```

### Task 4: Implement employee feedback creation with validation and initial timeline events

**Files:**
- Create: `backend/app/api/routes/feedbacks.py`
- Create: `backend/app/services/feedback_service.py`
- Create: `backend/app/services/moderation.py`
- Modify: `backend/app/main.py`
- Modify: `backend/app/schemas/feedback.py`
- Test: `backend/app/tests/test_create_feedback_api.py`

**Step 1: Write the failing test**

```python
from fastapi.testclient import TestClient

from app.main import app


def test_create_vent_feedback_returns_thread_code() -> None:
    client = TestClient(app)

    payload = {
        "type": "vent",
        "category": "engineering_process",
        "content_markdown": "CI 流水线经常在高峰期卡住。",
    }
    response = client.post("/api/v1/feedbacks", json=payload)

    assert response.status_code == 201
    assert response.json()["thread_code"].startswith("ECH-")
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/liqiuhua/work/techvoice/backend && pytest app/tests/test_create_feedback_api.py::test_create_vent_feedback_returns_thread_code -v`
Expected: FAIL because the route is missing.

**Step 3: Write minimal implementation**

```python
@router.post("/feedbacks", status_code=201)
def create_feedback(payload: FeedbackCreate, db: Session = Depends(get_db)) -> FeedbackCreateResponse:
    feedback = feedback_service.create_feedback(db, payload)
    return FeedbackCreateResponse(thread_code=feedback.thread_code)
```

**Step 4: Run test to verify it passes**

Run: `cd /Users/liqiuhua/work/techvoice/backend && pytest app/tests/test_create_feedback_api.py::test_create_vent_feedback_returns_thread_code -v`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/api/routes/feedbacks.py backend/app/services/feedback_service.py backend/app/services/moderation.py backend/app/main.py backend/app/tests/test_create_feedback_api.py
git commit -m "feat: add anonymous feedback submission api"
```

### Task 5: Implement thread lookup and anonymous follow-up replies

**Files:**
- Modify: `backend/app/api/routes/feedbacks.py`
- Modify: `backend/app/services/feedback_service.py`
- Modify: `backend/app/schemas/feedback.py`
- Test: `backend/app/tests/test_track_feedback_api.py`

**Step 1: Write the failing test**

```python
def test_reply_to_thread_appends_employee_event(client, created_feedback_thread_code) -> None:
    response = client.post(
        f"/api/v1/feedbacks/{created_feedback_thread_code}/replies",
        json={"content": "可以补充更多失败场景。"},
    )

    assert response.status_code == 201

    detail = client.get(f"/api/v1/feedbacks/{created_feedback_thread_code}")
    assert detail.status_code == 200
    assert detail.json()["events"][-1]["actor_type"] == "employee"
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/liqiuhua/work/techvoice/backend && pytest app/tests/test_track_feedback_api.py::test_reply_to_thread_appends_employee_event -v`
Expected: FAIL because the reply endpoint and detail endpoint are incomplete.

**Step 3: Write minimal implementation**

```python
@router.get("/feedbacks/{thread_code}")
def get_feedback(thread_code: str, db: Session = Depends(get_db)) -> FeedbackDetail:
    return feedback_service.get_feedback_by_thread_code(db, thread_code)


@router.post("/feedbacks/{thread_code}/replies", status_code=201)
def create_feedback_reply(thread_code: str, payload: FeedbackReplyCreate, db: Session = Depends(get_db)) -> FeedbackReplyResponse:
    return feedback_service.create_employee_reply(db, thread_code, payload)
```

**Step 4: Run test to verify it passes**

Run: `cd /Users/liqiuhua/work/techvoice/backend && pytest app/tests/test_track_feedback_api.py -v`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/api/routes/feedbacks.py backend/app/services/feedback_service.py backend/app/schemas/feedback.py backend/app/tests/test_track_feedback_api.py
git commit -m "feat: add thread tracking and anonymous replies"
```

### Task 6: Add admin auth and protected feedback management APIs

**Files:**
- Create: `backend/app/api/routes/admin_auth.py`
- Create: `backend/app/api/routes/admin_feedbacks.py`
- Create: `backend/app/core/security.py`
- Create: `backend/app/core/deps.py`
- Create: `backend/app/schemas/admin.py`
- Create: `backend/app/services/admin_service.py`
- Modify: `backend/app/main.py`
- Test: `backend/app/tests/test_admin_auth_api.py`
- Test: `backend/app/tests/test_admin_feedback_api.py`

**Step 1: Write the failing test**

```python
def test_admin_login_returns_access_token(client, seeded_admin) -> None:
    response = client.post(
        "/api/v1/admin/auth/login",
        json={"username": "admin", "password": "admin123456"},
    )

    assert response.status_code == 200
    assert "access_token" in response.json()
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/liqiuhua/work/techvoice/backend && pytest app/tests/test_admin_auth_api.py::test_admin_login_returns_access_token -v`
Expected: FAIL because admin auth is missing.

**Step 3: Write minimal implementation**

```python
@router.post("/admin/auth/login")
def login(payload: AdminLoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    admin = admin_service.authenticate(db, payload.username, payload.password)
    token = create_access_token(subject=admin.username)
    return TokenResponse(access_token=token)
```

**Step 4: Run test to verify it passes**

Run: `cd /Users/liqiuhua/work/techvoice/backend && pytest app/tests/test_admin_auth_api.py::test_admin_login_returns_access_token -v`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/api/routes/admin_auth.py backend/app/api/routes/admin_feedbacks.py backend/app/core backend/app/schemas/admin.py backend/app/services/admin_service.py backend/app/tests/test_admin_auth_api.py backend/app/tests/test_admin_feedback_api.py
git commit -m "feat: add admin auth and feedback management apis"
```

### Task 7: Add publish workflow and public wall APIs

**Files:**
- Create: `backend/app/api/routes/public_feedbacks.py`
- Modify: `backend/app/api/routes/admin_feedbacks.py`
- Modify: `backend/app/services/feedback_service.py`
- Modify: `backend/app/schemas/feedback.py`
- Test: `backend/app/tests/test_public_wall_api.py`

**Step 1: Write the failing test**

```python
def test_star_public_feedback_increments_counter_once(client, published_feedback_public_code) -> None:
    response = client.post(f"/api/v1/public/feedbacks/{published_feedback_public_code}/star")
    assert response.status_code == 201

    second = client.post(f"/api/v1/public/feedbacks/{published_feedback_public_code}/star")
    assert second.status_code == 409
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/liqiuhua/work/techvoice/backend && pytest app/tests/test_public_wall_api.py::test_star_public_feedback_increments_counter_once -v`
Expected: FAIL because the public routes and star de-duplication are missing.

**Step 3: Write minimal implementation**

```python
@router.get("/public/feedbacks")
def list_public_feedbacks(...) -> PublicFeedbackListResponse:
    return feedback_service.list_public_feedbacks(...)


@router.post("/public/feedbacks/{public_code}/star", status_code=201)
def star_public_feedback(public_code: str, request: Request, db: Session = Depends(get_db)) -> StarResponse:
    fingerprint = request.headers.get("x-star-token", request.client.host)
    return feedback_service.star_feedback(db, public_code, fingerprint)
```

**Step 4: Run test to verify it passes**

Run: `cd /Users/liqiuhua/work/techvoice/backend && pytest app/tests/test_public_wall_api.py -v`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/api/routes/public_feedbacks.py backend/app/api/routes/admin_feedbacks.py backend/app/services/feedback_service.py backend/app/schemas/feedback.py backend/app/tests/test_public_wall_api.py
git commit -m "feat: add public wall publish and star apis"
```

### Task 8: Add database migrations, seed data, and backend developer ergonomics

**Files:**
- Create: `backend/alembic.ini`
- Create: `backend/alembic/env.py`
- Create: `backend/alembic/versions/20260313_0001_initial_schema.py`
- Create: `backend/app/scripts/seed.py`
- Modify: `backend/pyproject.toml`
- Modify: `README.md`
- Test: `backend/app/tests/test_seed_script.py`

**Step 1: Write the failing test**

```python
from app.scripts.seed import default_admin_payload


def test_default_admin_username_is_admin() -> None:
    assert default_admin_payload()["username"] == "admin"
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/liqiuhua/work/techvoice/backend && pytest app/tests/test_seed_script.py -v`
Expected: FAIL because the seed script does not exist.

**Step 3: Write minimal implementation**

```python
def default_admin_payload() -> dict[str, str]:
    return {
        "username": "admin",
        "password": "admin123456",
        "display_name": "TechVoice Admin",
    }
```

**Step 4: Run test to verify it passes**

Run: `cd /Users/liqiuhua/work/techvoice/backend && pytest app/tests/test_seed_script.py -v`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/alembic backend/app/scripts/seed.py backend/pyproject.toml README.md backend/app/tests/test_seed_script.py
git commit -m "chore: add migrations and seed workflow"
```

### Task 9: Build the employee-facing React shell based on the supplied prototype

**Files:**
- Modify: `frontend/src/App.tsx`
- Create: `frontend/src/routes/index.tsx`
- Create: `frontend/src/pages/HomePage.tsx`
- Create: `frontend/src/pages/VentSubmitPage.tsx`
- Create: `frontend/src/pages/ProposalSubmitPage.tsx`
- Create: `frontend/src/pages/SuccessPage.tsx`
- Create: `frontend/src/components/LayoutShell.tsx`
- Create: `frontend/src/components/FeedbackTypeCard.tsx`
- Create: `frontend/src/components/ThreadCodeCard.tsx`
- Create: `frontend/src/styles.css`
- Test: `frontend/src/pages/HomePage.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import HomePage from "./HomePage";

it("renders both employee entry cards", () => {
  render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  );

  expect(screen.getByText("我要吐槽")).toBeInTheDocument();
  expect(screen.getByText("我有提案")).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/liqiuhua/work/techvoice/frontend && npm test -- HomePage.test.tsx`
Expected: FAIL because the page and routes do not exist.

**Step 3: Write minimal implementation**

```tsx
export default function HomePage() {
  return (
    <main>
      <h1>Echo｜TechVoice</h1>
      <button>我要吐槽</button>
      <button>我有提案</button>
    </main>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `cd /Users/liqiuhua/work/techvoice/frontend && npm test -- HomePage.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/App.tsx frontend/src/routes frontend/src/pages frontend/src/components frontend/src/styles.css
git commit -m "feat: add employee-facing react shell"
```

### Task 10: Implement employee submission forms, cooldown logic, and API integration

**Files:**
- Create: `frontend/src/api/client.ts`
- Create: `frontend/src/api/feedbacks.ts`
- Create: `frontend/src/lib/cooldown.ts`
- Create: `frontend/src/lib/sensitiveWords.ts`
- Modify: `frontend/src/pages/VentSubmitPage.tsx`
- Modify: `frontend/src/pages/ProposalSubmitPage.tsx`
- Modify: `frontend/src/pages/SuccessPage.tsx`
- Test: `frontend/src/pages/VentSubmitPage.test.tsx`
- Test: `frontend/src/pages/ProposalSubmitPage.test.tsx`
- Test: `frontend/src/lib/cooldown.test.ts`

**Step 1: Write the failing test**

```tsx
import { isCooldownActive, markSubmissionTime } from "../lib/cooldown";

it("activates a 10-minute local cooldown after submission", () => {
  markSubmissionTime(Date.now());
  expect(isCooldownActive(Date.now())).toBe(true);
});
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/liqiuhua/work/techvoice/frontend && npm test -- cooldown.test.ts`
Expected: FAIL because the cooldown helper does not exist.

**Step 3: Write minimal implementation**

```ts
const KEY = "techvoice-last-submit-at";
const WINDOW_MS = 10 * 60 * 1000;

export function markSubmissionTime(now: number) {
  localStorage.setItem(KEY, String(now));
}

export function isCooldownActive(now: number) {
  const raw = localStorage.getItem(KEY);
  return raw !== null && now - Number(raw) < WINDOW_MS;
}
```

**Step 4: Run test to verify it passes**

Run: `cd /Users/liqiuhua/work/techvoice/frontend && npm test -- cooldown.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/api frontend/src/lib frontend/src/pages/VentSubmitPage.tsx frontend/src/pages/ProposalSubmitPage.tsx frontend/src/pages/SuccessPage.tsx
git commit -m "feat: add submission forms and local cooldown logic"
```

### Task 11: Build tracking page, public wall, and star interaction

**Files:**
- Create: `frontend/src/pages/TrackLookupPage.tsx`
- Create: `frontend/src/pages/TrackDetailPage.tsx`
- Create: `frontend/src/pages/PublicWallPage.tsx`
- Create: `frontend/src/components/Timeline.tsx`
- Create: `frontend/src/components/PublicFeedbackCard.tsx`
- Modify: `frontend/src/routes/index.tsx`
- Modify: `frontend/src/api/feedbacks.ts`
- Test: `frontend/src/pages/TrackDetailPage.test.tsx`
- Test: `frontend/src/pages/PublicWallPage.test.tsx`

**Step 1: Write the failing test**

```tsx
it("renders timeline events for a tracked thread", async () => {
  render(<TrackDetailPage />);
  expect(await screen.findByText(/你的声音已加密送达/i)).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/liqiuhua/work/techvoice/frontend && npm test -- TrackDetailPage.test.tsx`
Expected: FAIL because the tracking page does not exist.

**Step 3: Write minimal implementation**

```tsx
export default function TrackDetailPage() {
  return <section>你的声音已加密送达</section>;
}
```

**Step 4: Run test to verify it passes**

Run: `cd /Users/liqiuhua/work/techvoice/frontend && npm test -- TrackDetailPage.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/pages/TrackLookupPage.tsx frontend/src/pages/TrackDetailPage.tsx frontend/src/pages/PublicWallPage.tsx frontend/src/components/Timeline.tsx frontend/src/components/PublicFeedbackCard.tsx frontend/src/routes/index.tsx frontend/src/api/feedbacks.ts
git commit -m "feat: add tracking and public wall pages"
```

### Task 12: Build the admin front-end workflow

**Files:**
- Create: `frontend/src/pages/admin/AdminLoginPage.tsx`
- Create: `frontend/src/pages/admin/AdminFeedbackListPage.tsx`
- Create: `frontend/src/pages/admin/AdminFeedbackDetailPage.tsx`
- Create: `frontend/src/pages/admin/AdminPublicWallPage.tsx`
- Create: `frontend/src/api/admin.ts`
- Create: `frontend/src/components/admin/AdminGuard.tsx`
- Create: `frontend/src/components/admin/StatusBadge.tsx`
- Modify: `frontend/src/routes/index.tsx`
- Test: `frontend/src/pages/admin/AdminLoginPage.test.tsx`
- Test: `frontend/src/pages/admin/AdminFeedbackListPage.test.tsx`

**Step 1: Write the failing test**

```tsx
it("submits admin credentials and stores the token", async () => {
  render(<AdminLoginPage />);
  expect(screen.getByLabelText(/用户名/i)).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/liqiuhua/work/techvoice/frontend && npm test -- AdminLoginPage.test.tsx`
Expected: FAIL because the admin login page does not exist.

**Step 3: Write minimal implementation**

```tsx
export default function AdminLoginPage() {
  return (
    <form>
      <label>
        用户名
        <input />
      </label>
    </form>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `cd /Users/liqiuhua/work/techvoice/frontend && npm test -- AdminLoginPage.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/pages/admin frontend/src/api/admin.ts frontend/src/components/admin frontend/src/routes/index.tsx
git commit -m "feat: add admin dashboard flow"
```

### Task 13: Run end-to-end verification and polish developer docs

**Files:**
- Modify: `README.md`
- Modify: `backend/pyproject.toml`
- Modify: `frontend/package.json`
- Modify: `frontend/vite.config.ts`
- Modify: `frontend/src/styles.css`

**Step 1: Write the failing verification checklist**

```text
- backend tests pass
- frontend tests pass
- backend app starts
- frontend app starts
- seeded admin can log in
- employee submit -> track -> admin reply -> publish -> wall flow works
```

**Step 2: Run verification commands to surface current failures**

Run: `cd /Users/liqiuhua/work/techvoice/backend && pytest -v`
Expected: FAIL until all backend features are complete.

Run: `cd /Users/liqiuhua/work/techvoice/frontend && npm test -- --runInBand`
Expected: FAIL until all front-end features are complete.

**Step 3: Write minimal remaining implementation and docs**

```text
- add README startup commands
- add sample env values
- ensure front-end API base URL is configurable
- confirm seed instructions are present
```

**Step 4: Run verification to confirm everything passes**

Run: `cd /Users/liqiuhua/work/techvoice/backend && pytest -v`
Expected: PASS with 0 failures

Run: `cd /Users/liqiuhua/work/techvoice/frontend && npm test -- --runInBand`
Expected: PASS with 0 failures

Run: `cd /Users/liqiuhua/work/techvoice/backend && uvicorn app.main:app --reload`
Expected: Service starts on a local port without import errors

Run: `cd /Users/liqiuhua/work/techvoice/frontend && npm run dev`
Expected: Vite dev server starts without compile errors

**Step 5: Commit**

```bash
git add README.md backend frontend
git commit -m "chore: verify techvoice mvp end to end"
```

## Execution Notes

- Use TDD exactly as written: write the failing test, run it, implement minimally, re-run it.
- Because `/Users/liqiuhua/work/techvoice` is not currently a git repository, commit steps are blocked until the repository is initialized by the user or in a later setup step.
- Keep the employee-facing visual language close to the supplied prototype, but implement it with reusable React components instead of one large HTML file.
