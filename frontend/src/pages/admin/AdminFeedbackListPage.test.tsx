import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import AdminFeedbackListPage from "./AdminFeedbackListPage";

function buildListResponse(
  overrides?: Partial<{
    items: Array<{
      id: number;
      thread_code: string;
      public_code: string;
      type: "vent" | "proposal";
      category: string;
      status: string;
      is_public: boolean;
      star_count: number;
      title: string | null;
      created_at: string;
      updated_at: string;
    }>;
    total: number;
    page: number;
    page_size: number;
  }>,
) {
  return {
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
    total: 1,
    page: 1,
    page_size: 10,
    ...overrides,
  };
}

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

it("loads the unreplied tab by default and preserves the current list query on detail links", async () => {
  const fetchMock = vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValueOnce(new Response(JSON.stringify(buildListResponse())));

  localStorage.setItem("techvoice-admin-token", "demo-token");

  render(
    <MemoryRouter initialEntries={["/admin/feedbacks"]}>
      <AdminFeedbackListPage />
    </MemoryRouter>,
  );

  expect(await screen.findByText(/ECH-AB12CD/i)).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledWith(
    expect.stringContaining("/api/v1/admin/feedbacks?tab=unreplied&status=all&page=1&page_size=10"),
    expect.any(Object),
  );
  expect(screen.getByRole("tab", { name: "未回复" })).toHaveClass("admin-tab-active");
  expect(screen.getByRole("link", { name: /ECH-AB12CD/i })).toHaveAttribute(
    "href",
    "/admin/feedbacks/1?tab=unreplied&status=all&page=1",
  );
});

it("switches to the processed tab and resets the page when the status filter changes", async () => {
  const fetchMock = vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValueOnce(new Response(JSON.stringify(buildListResponse({ total: 12 }))))
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify(
          buildListResponse({
            items: [
              {
                id: 2,
                thread_code: "ECH-EF34GH",
                public_code: "PUB-EF34GH",
                type: "vent",
                category: "collaboration",
                status: "accepted",
                is_public: false,
                star_count: 0,
                title: null,
                created_at: "2026-03-14T00:00:00Z",
                updated_at: "2026-03-14T00:00:00Z",
              },
            ],
          }),
        ),
      ),
    )
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify(
          buildListResponse({
            items: [
              {
                id: 3,
                thread_code: "ECH-IJ56KL",
                public_code: "PUB-IJ56KL",
                type: "vent",
                category: "collaboration",
                status: "accepted",
                is_public: false,
                star_count: 0,
                title: null,
                created_at: "2026-03-15T00:00:00Z",
                updated_at: "2026-03-15T00:00:00Z",
              },
            ],
          }),
        ),
      ),
    );

  localStorage.setItem("techvoice-admin-token", "demo-token");
  const user = userEvent.setup();

  render(
    <MemoryRouter initialEntries={["/admin/feedbacks?page=2"]}>
      <AdminFeedbackListPage />
    </MemoryRouter>,
  );

  expect(await screen.findByText(/ECH-AB12CD/i)).toBeInTheDocument();

  await user.click(screen.getByRole("tab", { name: "已处理" }));
  expect(await screen.findByText(/ECH-EF34GH/i)).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledWith(
    expect.stringContaining("/api/v1/admin/feedbacks?tab=processed&status=all&page=1&page_size=10"),
    expect.any(Object),
  );

  await user.selectOptions(screen.getByLabelText("状态分类"), "accepted");
  expect(await screen.findByText(/ECH-IJ56KL/i)).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledWith(
    expect.stringContaining("/api/v1/admin/feedbacks?tab=processed&status=accepted&page=1&page_size=10"),
    expect.any(Object),
  );
});

it("uses the compact section title style for the admin board heading", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
    new Response(
      JSON.stringify({
        items: [],
        total: 0,
        page: 1,
        page_size: 10,
      }),
    ),
  );

  localStorage.setItem("techvoice-admin-token", "demo-token");

  render(
    <MemoryRouter>
      <AdminFeedbackListPage />
    </MemoryRouter>,
  );

  expect(await screen.findByRole("heading", { name: "匿名反馈看板" })).toHaveClass("section-title");
});
