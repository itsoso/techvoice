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
});
