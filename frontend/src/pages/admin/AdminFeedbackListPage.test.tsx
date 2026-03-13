import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";

import AdminFeedbackListPage from "./AdminFeedbackListPage";

it("renders feedback rows from the admin api", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
    new Response(
      JSON.stringify({
        items: [
          {
            id: 1,
            thread_code: "ECH-AB12CD",
            public_code: "PUB-AB12CD",
            type: "vent",
            category: "engineering_process",
            status: "received",
            is_public: false,
            star_count: 0,
            title: null,
            created_at: "2026-03-13T00:00:00Z",
            updated_at: "2026-03-13T00:00:00Z",
          },
        ],
      }),
    ),
  );

  localStorage.setItem("techvoice-admin-token", "demo-token");

  render(
    <MemoryRouter>
      <AdminFeedbackListPage />
    </MemoryRouter>,
  );

  expect(await screen.findByText(/ECH-AB12CD/i)).toBeInTheDocument();
});
