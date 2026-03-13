import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";

import LoungeLandingPage from "./LoungeLandingPage";

afterEach(() => {
  vi.restoreAllMocks();
});

it("shows the current tenant lounge event and links to the ticket page", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
    new Response(
      JSON.stringify({
        id: 42,
        title: "Friday Lounge",
        description: "限时匿名会客厅",
        ticket_open_at: "2026-03-13T05:30:00Z",
        start_at: "2026-03-13T06:00:00Z",
        end_at: "2026-03-13T07:00:00Z",
        ticket_limit: 5,
        status: "ticketing",
      }),
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    ),
  );

  render(
    <MemoryRouter initialEntries={["/t/acme/lounge"]}>
      <Routes>
        <Route path="/t/:tenantSlug/lounge" element={<LoungeLandingPage />} />
      </Routes>
    </MemoryRouter>,
  );

  expect(await screen.findByRole("heading", { level: 1, name: "限时匿名会客厅" })).toBeInTheDocument();
  expect(screen.getByText("Friday Lounge")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "进入抢票" })).toHaveAttribute("href", "/t/acme/lounge/42/ticket");
});
