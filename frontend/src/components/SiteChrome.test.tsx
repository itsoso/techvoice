import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";

import SiteChrome from "./SiteChrome";

function mockMatchMedia(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation(() => ({
      matches,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

afterEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
  vi.unstubAllGlobals();
});

it("renders primary navigation and breadcrumbs", () => {
  mockMatchMedia(true);

  render(
    <MemoryRouter initialEntries={["/track"]}>
      <SiteChrome
        breadcrumbs={[
          { label: "首页", to: "/" },
          { label: "查询追踪" },
        ]}
      />
    </MemoryRouter>,
  );

  expect(screen.getByRole("navigation", { name: "主导航" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "我要吐槽" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "系统架构" })).toBeInTheDocument();
  expect(screen.getByRole("navigation", { name: "面包屑" })).toBeInTheDocument();
  expect(screen.getByRole("navigation", { name: "面包屑" })).toHaveTextContent("查询追踪");
});

it("lets visitors switch theme from the compact theme selector", async () => {
  mockMatchMedia(true);
  const user = userEvent.setup();

  render(
    <MemoryRouter initialEntries={["/track"]}>
      <SiteChrome
        breadcrumbs={[
          { label: "首页", to: "/" },
          { label: "查询追踪" },
        ]}
      />
    </MemoryRouter>,
  );

  await user.selectOptions(screen.getByRole("combobox", { name: "主题模式" }), "light");

  expect(document.documentElement.dataset.theme).toBe("light");
  expect(localStorage.getItem("techvoice-theme-preference")).toBe("light");
});
