import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";

import PublicWallPage from "./PublicWallPage";

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

it("renders published feedback cards", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
    new Response(
      JSON.stringify({
        items: [
          {
            public_code: "PUB-AB12CD",
            type: "vent",
            category: "engineering_process",
            status: "published",
            title: null,
            content_markdown: "把长时间排队的任务窗口公开出来。",
            proposal_problem: null,
            proposal_impact: null,
            proposal_suggestion: null,
            admin_replies: [],
            star_count: 2,
            created_at: "2026-03-13T00:00:00Z",
          },
        ],
      }),
    ),
  );

  render(
    <MemoryRouter>
      <PublicWallPage />
    </MemoryRouter>,
  );

  expect(await screen.findByText(/长时间排队的任务窗口公开出来/i)).toBeInTheDocument();
  expect(screen.getByRole("heading", { level: 1, name: "回音壁" })).toHaveClass("section-title");
  expect(screen.getByRole("heading", { level: 2, name: "敏锐观察" })).toHaveClass("wall-card-title");
});

it("renders full proposal content and admin replies on the public wall", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
    new Response(
      JSON.stringify({
        items: [
          {
            public_code: "PUB-XY98ZT",
            type: "proposal",
            category: "engineering_process",
            status: "published",
            title: null,
            content_markdown: null,
            proposal_problem: "发布窗口和联调排期经常冲突。",
            proposal_impact: "需求上线节奏反复被打断，跨团队沟通成本变高。",
            proposal_suggestion: "统一在周三冻结需求并提前一天确认联调资源。",
            admin_replies: [
              {
                content: "已经安排负责人评估这个流程调整。",
                created_at: "2026-03-13T10:00:00Z",
              },
            ],
            employee_replies: [
              {
                content: "补充一下，主要堵点出在跨团队联调。",
                created_at: "2026-03-13T11:00:00Z",
              },
            ],
            star_count: 4,
            created_at: "2026-03-13T00:00:00Z",
          },
        ],
      }),
    ),
  );

  render(
    <MemoryRouter>
      <PublicWallPage />
    </MemoryRouter>,
  );

  expect(await screen.findByText("观察到的现象")).toBeInTheDocument();
  expect(screen.getByText("发布窗口和联调排期经常冲突。")).toBeInTheDocument();
  expect(screen.getByText("带来的影响")).toBeInTheDocument();
  expect(screen.getByText("需求上线节奏反复被打断，跨团队沟通成本变高。")).toBeInTheDocument();
  expect(screen.getByText("建议方案")).toBeInTheDocument();
  expect(screen.getByText("统一在周三冻结需求并提前一天确认联调资源。")).toBeInTheDocument();
  expect(screen.getByText("管理员回复")).toBeInTheDocument();
  expect(screen.getByText("已经安排负责人评估这个流程调整。")).toBeInTheDocument();
  expect(screen.getByText("匿名补充")).toBeInTheDocument();
  expect(screen.getByText("补充一下，主要堵点出在跨团队联调。")).toBeInTheDocument();
});

it("lets admins hide a published wall item directly from the public wall", async () => {
  localStorage.setItem("techvoice-admin-token", "demo-token");
  const user = userEvent.setup();

  vi.spyOn(globalThis, "fetch")
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          items: [
            {
              public_code: "PUB-AB12CD",
              type: "vent",
              category: "engineering_process",
              status: "published",
              title: null,
              content_markdown: "这个公开内容需要被撤回。",
              proposal_problem: null,
              proposal_impact: null,
              proposal_suggestion: null,
              admin_replies: [],
              employee_replies: [],
              star_count: 2,
              created_at: "2026-03-13T00:00:00Z",
            },
          ],
        }),
      ),
    )
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: 3,
          thread_code: "ECH-AB12CD",
          public_code: "PUB-AB12CD",
          type: "vent",
          category: "engineering_process",
          status: "hidden",
          is_public: false,
          star_count: 2,
          title: null,
          created_at: "2026-03-13T00:00:00Z",
          updated_at: "2026-03-13T01:00:00Z",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );

  render(
    <MemoryRouter>
      <PublicWallPage />
    </MemoryRouter>,
  );

  expect(await screen.findByText("这个公开内容需要被撤回。")).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "撤回" }));

  expect(screen.queryByText("这个公开内容需要被撤回。")).not.toBeInTheDocument();
});
