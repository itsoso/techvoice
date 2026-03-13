# TechVoice MVP Design

**Date:** 2026-03-13

**Goal**

Build a front-end/back-end separated MVP for the TechVoice anonymous feedback channel described in the PRD. The MVP must support anonymous submission, thread-code tracking, anonymous follow-up replies, admin triage and response workflows, and a public wall for published feedback.

**Inputs**

- PRD: `/Users/liqiuhua/Downloads/Echo｜TechVoice：技术团队匿名沟通渠道.pdf`
- Reference prototype: `/Users/liqiuhua/Library/Application Support/Kim (Kim)/userData/b87eca588ddb427a88b267b3eb9e5505/Kim file/2026-03/techvoice.html`

## Scope

Included in MVP:

- Employee-side anonymous feedback submission
- Two submission modes: `vent` and `proposal`
- Structured proposal form with problem, impact, suggestion fields
- Sensitive-word blocking on both front end and back end
- Local front-end submit throttling using `localStorage`
- Server-generated thread code
- Thread tracking page with event timeline
- Anonymous follow-up replies by thread code
- Admin login with local credentials
- Admin list/detail/reply/status change/publish workflows
- Public wall with category filters and star action

Excluded from MVP:

- Real enterprise SSO
- Real employee identity verification
- Real KIM or IM push integration
- File upload and image upload
- Coupon issuance
- Device fingerprinting and server-side anti-spam

## Architecture

The system is a classic front-end/back-end separated web app.

- Front end: React SPA served independently from the API
- Back end: FastAPI REST service with JWT-based admin auth
- Database: SQLite for local development and MVP persistence
- Styling: Tailwind CSS, visually aligned with the supplied `techvoice.html`

The anonymous trust model for MVP is intentionally narrow:

- The employee-facing API does not accept or store employee identity fields
- Thread lookup is authorized only by possession of the thread code
- Mock adapters are used for the future identity gateway and IM push flows so the architecture stays extensible

## Product Flows

### 1. Employee submits feedback

1. User lands on the employee home page.
2. User chooses `我要吐槽` or `我有提案`.
3. Front end validates required fields, word limits, and sensitive words.
4. Front end checks the local submission cooldown from `localStorage`.
5. Front end submits to the API.
6. Back end validates payload and creates:
   - a `feedback` row
   - an initial `submitted` event
   - a generated `thread_code`
7. Front end navigates to the success screen and displays the thread code.

### 2. Employee tracks progress

1. User opens the tracking page and enters the thread code.
2. Front end fetches feedback summary and event timeline.
3. Timeline renders system events, status changes, admin replies, and employee follow-up messages.
4. If the thread is still open for follow-up, the employee can submit an anonymous reply.

### 3. Admin triages feedback

1. Admin logs in with local credentials.
2. Admin opens the feedback list.
3. Admin filters by type, category, and status.
4. Admin opens a feedback detail page.
5. Admin replies, requests more information, accepts, defers, or publishes.
6. Each action appends a timeline event and updates aggregate fields on the feedback record.

### 4. Public wall

1. Visitors open the wall page.
2. The page fetches only `is_public = true` feedback.
3. Visitors filter by category and sort by latest or hottest.
4. Visitors can star a feedback item once per client token.

## Data Model

### `admins`

- `id`
- `username`
- `password_hash`
- `display_name`
- `is_active`
- `created_at`

### `feedbacks`

- `id`
- `thread_code`
- `public_code`
- `type` (`vent`, `proposal`)
- `title`
- `content_markdown`
- `proposal_problem`
- `proposal_impact`
- `proposal_suggestion`
- `category`
- `status` (`received`, `reviewing`, `needs_info`, `accepted`, `deferred`, `published`)
- `is_public`
- `star_count`
- `created_at`
- `updated_at`

### `feedback_events`

- `id`
- `feedback_id`
- `actor_type` (`system`, `admin`, `employee`)
- `event_type` (`submitted`, `status_changed`, `reply`, `published`, `starred`)
- `content`
- `meta_json`
- `created_at`

### `stars`

- `id`
- `feedback_id`
- `client_fingerprint`
- `created_at`

## API Surface

### Employee APIs

- `POST /api/v1/feedbacks`
- `GET /api/v1/feedbacks/{thread_code}`
- `POST /api/v1/feedbacks/{thread_code}/replies`

### Public APIs

- `GET /api/v1/public/feedbacks`
- `POST /api/v1/public/feedbacks/{public_code}/star`

### Admin APIs

- `POST /api/v1/admin/auth/login`
- `GET /api/v1/admin/feedbacks`
- `GET /api/v1/admin/feedbacks/{feedback_id}`
- `POST /api/v1/admin/feedbacks/{feedback_id}/reply`
- `POST /api/v1/admin/feedbacks/{feedback_id}/status`
- `POST /api/v1/admin/feedbacks/{feedback_id}/publish`

### Utility APIs

- `GET /api/v1/health`

## Front-End Routes

### Employee routes

- `/`
- `/submit/vent`
- `/submit/proposal`
- `/success/:threadCode`
- `/track`
- `/track/:threadCode`

### Admin routes

- `/admin/login`
- `/admin/feedbacks`
- `/admin/feedbacks/:feedbackId`
- `/admin/public-wall`

### Public routes

- `/wall`

## Validation Rules

- `vent` submission:
  - `content_markdown` required
  - max length 500
- `proposal` submission:
  - `proposal_problem` required
  - `proposal_impact` required
  - `proposal_suggestion` required
  - combined effective length limited to 500 characters for MVP
- `category` required from a predefined enum
- Sensitive words rejected on both front end and back end
- Admin status transitions constrained by service rules
- Publish requires a non-empty admin reply or an existing response event

## State Machine

Normal flow:

- `received`
- `reviewing`
- `needs_info`
- `accepted`
- `deferred`
- `published`

Rules:

- New feedback starts at `received`
- Admin may move `received -> reviewing`
- Admin may move `reviewing -> needs_info | accepted | deferred`
- Admin may move `needs_info -> reviewing` after employee follow-up
- `published` is only reachable from an admin publish action

## Security and Trust Notes

- Admin endpoints require JWT auth
- Passwords are stored with bcrypt hashes
- Employee endpoints do not log identity-bearing fields
- Thread codes are random high-entropy identifiers
- Public wall uses `public_code`, not `thread_code`
- MVP anti-abuse is intentionally lightweight and front-end biased

## Initial Project Structure

```text
techvoice/
  backend/
    app/
      api/
      core/
      db/
      models/
      schemas/
      services/
      tests/
    alembic/
    pyproject.toml
  frontend/
    src/
      api/
      components/
      features/
      lib/
      pages/
      routes/
      test/
    package.json
  docs/
    plans/
```

## Testing Strategy

### Back end

- `pytest`
- API tests for:
  - feedback creation
  - validation failures
  - thread lookup
  - anonymous reply
  - admin login
  - status transition enforcement
  - publish flow
  - star de-duplication

### Front end

- `vitest` + `@testing-library/react`
- UI tests for:
  - employee entry-page flow
  - form validation
  - sensitive-word blocking
  - local cooldown behavior
  - success-page rendering
  - tracking timeline rendering
  - admin login and dashboard interactions

### Integration

- local seed admin account
- one command per app for dev startup
- manual smoke path from employee submit to admin reply to public wall render

## Delivery Notes

- The reference `techvoice.html` should influence the employee-side look and feel, but implementation should be componentized and data-driven.
- Because the current directory is not a git repository, this design is written to disk but cannot be committed yet.
