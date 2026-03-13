import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import TenantLoungeAdminPage from "./TenantLoungeAdminPage";

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

it("loads executives and creates a lounge event from the tenant admin console", async () => {
  localStorage.setItem("techvoice-tenant-admin-token:acme", "tenant-admin-token");

  vi.spyOn(globalThis, "fetch")
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          items: [
            {
              id: 7,
              name: "Alice Wang",
              email: "alice@example.com",
              title: "VP of Engineering",
              approval_status: "pending",
              created_at: "2026-03-13T05:00:00Z",
            },
          ],
        }),
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    )
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          items: [],
        }),
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    )
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: 42,
          title: "Friday Lounge",
          description: "Live anonymous session",
          ticket_open_at: "2026-03-13T05:30:00Z",
          start_at: "2026-03-13T06:00:00Z",
          end_at: "2026-03-13T07:00:00Z",
          ticket_limit: 5,
          status: "draft",
          created_at: "2026-03-13T05:00:00Z",
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
    <MemoryRouter initialEntries={["/t/acme/admin/lounge-events"]}>
      <Routes>
        <Route path="/t/:tenantSlug/admin/lounge-events" element={<TenantLoungeAdminPage />} />
      </Routes>
    </MemoryRouter>,
  );

  expect(await screen.findByText("Alice Wang")).toBeInTheDocument();

  await user.type(screen.getByRole("textbox", { name: "活动标题" }), "Friday Lounge");
  await user.type(screen.getByRole("textbox", { name: "活动说明" }), "Live anonymous session");
  await user.type(screen.getByRole("spinbutton", { name: "票数上限" }), "5");
  await user.type(screen.getByLabelText("抢票开放"), "2026-03-13T13:30");
  await user.type(screen.getByLabelText("正式开始"), "2026-03-13T14:00");
  await user.type(screen.getByLabelText("活动结束"), "2026-03-13T15:00");
  await user.click(screen.getByRole("button", { name: "创建活动" }));

  expect(await screen.findByText("Friday Lounge")).toBeInTheDocument();
});
