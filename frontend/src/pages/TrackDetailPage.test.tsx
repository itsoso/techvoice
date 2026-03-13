import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";

import TrackDetailPage from "./TrackDetailPage";

it("renders timeline events for a tracked thread", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
    new Response(
      JSON.stringify({
        thread_code: "ECH-AB12CD",
        public_code: "PUB-AB12CD",
        type: "vent",
        category: "engineering_process",
        status: "reviewing",
        is_public: false,
        star_count: 0,
        title: null,
        content_markdown: "流水线排队。",
        proposal_problem: null,
        proposal_impact: null,
        proposal_suggestion: null,
        created_at: "2026-03-13T00:00:00Z",
        updated_at: "2026-03-13T00:00:00Z",
        events: [
          {
            actor_type: "system",
            event_type: "submitted",
            content: "你的声音已加密送达",
            meta_json: null,
            created_at: "2026-03-13T00:00:00Z",
          },
        ],
      }),
    ),
  );

  render(
    <MemoryRouter initialEntries={["/track/ECH-AB12CD"]}>
      <Routes>
        <Route path="/track/:threadCode" element={<TrackDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );

  expect(await screen.findByText(/你的声音已加密送达/i)).toBeInTheDocument();
});
