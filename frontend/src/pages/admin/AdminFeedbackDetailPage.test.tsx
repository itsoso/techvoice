import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import AdminFeedbackDetailPage from "./AdminFeedbackDetailPage";

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

it("shows the api error instead of throwing when reply submission fails", async () => {
  vi.spyOn(globalThis, "fetch")
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          thread_code: "ECH-657991",
          public_code: "PUB-81C8D3",
          type: "vent",
          category: "collaboration",
          status: "received",
          is_public: false,
          star_count: 0,
          title: null,
          content_markdown: "测试一下",
          proposal_problem: null,
          proposal_impact: null,
          proposal_suggestion: null,
          created_at: "2026-03-13T06:10:41.667054",
          updated_at: "2026-03-13T06:10:41.667058",
          events: [
            {
              actor_type: "system",
              event_type: "submitted",
              content: "你的声音已加密送达",
              meta_json: null,
              created_at: "2026-03-13T06:10:41.667911",
            },
          ],
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    )
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          detail: [
            {
              loc: ["body", "content"],
              msg: "Field required",
            },
          ],
        }),
        {
          status: 422,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );

  localStorage.setItem("techvoice-admin-token", "demo-token");
  const user = userEvent.setup();

  render(
    <MemoryRouter initialEntries={["/admin/feedbacks/2"]}>
      <Routes>
        <Route path="/admin/feedbacks/:feedbackId" element={<AdminFeedbackDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );

  expect(await screen.findByText("ECH-657991")).toBeInTheDocument();
  expect(screen.getByText("匿名用户提交内容")).toBeInTheDocument();
  expect(screen.getByText("测试一下")).toBeInTheDocument();

  await user.type(screen.getByLabelText(/管理员回复/i), "22");
  await user.click(screen.getByRole("button", { name: /发送回复/i }));

  expect(await screen.findByText("body.content: Field required")).toBeInTheDocument();
});

it("appends the admin reply to the timeline after a successful submission", async () => {
  vi.spyOn(globalThis, "fetch")
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          thread_code: "ECH-657991",
          public_code: "PUB-81C8D3",
          type: "vent",
          category: "collaboration",
          status: "received",
          is_public: false,
          star_count: 0,
          title: null,
          content_markdown: "测试一下",
          proposal_problem: null,
          proposal_impact: null,
          proposal_suggestion: null,
          created_at: "2026-03-13T06:10:41.667054",
          updated_at: "2026-03-13T06:10:41.667058",
          events: [
            {
              actor_type: "system",
              event_type: "submitted",
              content: "你的声音已加密送达",
              meta_json: null,
              created_at: "2026-03-13T06:10:41.667911",
            },
          ],
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    )
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ created: true }), {
        status: 201,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

  localStorage.setItem("techvoice-admin-token", "demo-token");
  const user = userEvent.setup();

  render(
    <MemoryRouter initialEntries={["/admin/feedbacks/2"]}>
      <Routes>
        <Route path="/admin/feedbacks/:feedbackId" element={<AdminFeedbackDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );

  expect(await screen.findByText("ECH-657991")).toBeInTheDocument();

  const textarea = screen.getByLabelText(/管理员回复/i);
  await user.type(textarea, "67");
  await user.click(screen.getByRole("button", { name: /发送回复/i }));

  expect(textarea).toHaveValue("");
  expect(await screen.findByText("67")).toBeInTheDocument();
});

it("shows a success message and offers withdraw after it is sent to the wall", async () => {
  vi.spyOn(globalThis, "fetch")
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          thread_code: "ECH-657991",
          public_code: "PUB-81C8D3",
          type: "vent",
          category: "collaboration",
          status: "received",
          is_public: false,
          star_count: 0,
          title: null,
          content_markdown: "测试一下",
          proposal_problem: null,
          proposal_impact: null,
          proposal_suggestion: null,
          created_at: "2026-03-13T06:10:41.667054",
          updated_at: "2026-03-13T06:10:41.667058",
          events: [
            {
              actor_type: "system",
              event_type: "submitted",
              content: "你的声音已加密送达",
              meta_json: null,
              created_at: "2026-03-13T06:10:41.667911",
            },
          ],
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    )
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: 2,
          thread_code: "ECH-657991",
          public_code: "PUB-81C8D3",
          type: "vent",
          category: "collaboration",
          status: "published",
          is_public: true,
          star_count: 0,
          title: null,
          created_at: "2026-03-13T06:10:41.667054",
          updated_at: "2026-03-13T06:25:00.000000",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );

  localStorage.setItem("techvoice-admin-token", "demo-token");
  const user = userEvent.setup();

  render(
    <MemoryRouter initialEntries={["/admin/feedbacks/2"]}>
      <Routes>
        <Route path="/admin/feedbacks/:feedbackId" element={<AdminFeedbackDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );

  expect(await screen.findByText("ECH-657991")).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "发布到回音壁" }));

  expect(await screen.findByText("已发布到回音壁。")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "撤回回音壁" })).toBeInTheDocument();
  expect(screen.getByText("已公开到回音壁")).toBeInTheDocument();
});

it("lets admins withdraw and restore a wall item from the detail page", async () => {
  vi.spyOn(globalThis, "fetch")
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          thread_code: "ECH-657991",
          public_code: "PUB-81C8D3",
          type: "vent",
          category: "collaboration",
          status: "published",
          is_public: true,
          star_count: 0,
          title: null,
          content_markdown: "测试一下",
          proposal_problem: null,
          proposal_impact: null,
          proposal_suggestion: null,
          created_at: "2026-03-13T06:10:41.667054",
          updated_at: "2026-03-13T06:10:41.667058",
          events: [
            {
              actor_type: "system",
              event_type: "submitted",
              content: "你的声音已加密送达",
              meta_json: null,
              created_at: "2026-03-13T06:10:41.667911",
            },
          ],
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    )
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: 2,
          thread_code: "ECH-657991",
          public_code: "PUB-81C8D3",
          type: "vent",
          category: "collaboration",
          status: "hidden",
          is_public: false,
          star_count: 0,
          title: null,
          created_at: "2026-03-13T06:10:41.667054",
          updated_at: "2026-03-13T06:25:00.000000",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    )
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: 2,
          thread_code: "ECH-657991",
          public_code: "PUB-81C8D3",
          type: "vent",
          category: "collaboration",
          status: "published",
          is_public: true,
          star_count: 0,
          title: null,
          created_at: "2026-03-13T06:10:41.667054",
          updated_at: "2026-03-13T06:30:00.000000",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );

  localStorage.setItem("techvoice-admin-token", "demo-token");
  const user = userEvent.setup();

  render(
    <MemoryRouter initialEntries={["/admin/feedbacks/2"]}>
      <Routes>
        <Route path="/admin/feedbacks/:feedbackId" element={<AdminFeedbackDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );

  expect(await screen.findByText("ECH-657991")).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "撤回回音壁" }));

  expect(await screen.findByText("已从回音壁撤回。")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "恢复到回音壁" })).toBeInTheDocument();
  expect(screen.getByText("已从回音壁撤回")).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "恢复到回音壁" }));

  expect(await screen.findByText("已恢复到回音壁。")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "撤回回音壁" })).toBeInTheDocument();
  expect(screen.getByText("已恢复公开到回音壁")).toBeInTheDocument();
});
