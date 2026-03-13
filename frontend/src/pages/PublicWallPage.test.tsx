import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";

import PublicWallPage from "./PublicWallPage";

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
});
