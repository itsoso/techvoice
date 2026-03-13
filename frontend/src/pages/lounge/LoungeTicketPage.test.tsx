import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";

import LoungeTicketPage from "./LoungeTicketPage";

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

it("claims a lounge ticket and explains that it only lives in localStorage", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
    new Response(
      JSON.stringify({
        ticket_code: "TKT-ABCD1234",
        entry_token: "entry-token",
        alias_label: "匿名者A",
      }),
      {
        status: 201,
        headers: {
          "Content-Type": "application/json",
        },
      },
    ),
  );

  const user = userEvent.setup();

  render(
    <MemoryRouter initialEntries={["/t/acme/lounge/42/ticket"]}>
      <Routes>
        <Route path="/t/:tenantSlug/lounge/:eventId/ticket" element={<LoungeTicketPage />} />
      </Routes>
    </MemoryRouter>,
  );

  await user.click(screen.getByRole("button", { name: "立即抢票" }));

  expect(await screen.findByText("匿名者A")).toBeInTheDocument();
  expect(screen.getByText(/只保存在当前浏览器的 localStorage 中/i)).toBeInTheDocument();
  expect(localStorage.getItem("techvoice-lounge-ticket:acme:42")).toContain("TKT-ABCD1234");
});
