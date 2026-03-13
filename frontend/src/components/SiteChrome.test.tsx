import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";

import SiteChrome from "./SiteChrome";
import { clearAdminToken, setAdminToken } from "../api/admin";

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
  clearAdminToken();
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
  expect(screen.getByRole("link", { name: "管理员登录" })).toHaveAttribute("href", "/admin/login");
  expect(screen.getByRole("button", { name: /显示/i })).toHaveTextContent("深色");
  expect(screen.queryByRole("link", { name: "系统架构" })).not.toBeInTheDocument();
  expect(screen.getByRole("navigation", { name: "面包屑" })).toBeInTheDocument();
  expect(screen.getByRole("navigation", { name: "面包屑" })).toHaveTextContent("查询追踪");
});

it("opens the display menu for theme changes and architecture navigation", async () => {
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

  await user.click(screen.getByRole("button", { name: /显示/i }));
  expect(screen.getByRole("menu")).toBeInTheDocument();
  expect(screen.getByRole("menuitem", { name: "系统架构" })).toHaveAttribute("href", "/architecture");
  expect(screen.getByRole("menuitem", { name: "项目复盘" })).toHaveAttribute("href", "/retrospective");

  await user.click(screen.getByRole("menuitemradio", { name: "浅色" }));

  expect(document.documentElement.dataset.theme).toBe("light");
  expect(localStorage.getItem("techvoice-theme-preference")).toBe("light");
});

it("shows logout for authenticated admins and clears the token", async () => {
  mockMatchMedia(true);
  setAdminToken("token-123");
  const user = userEvent.setup();

  render(
    <MemoryRouter initialEntries={["/admin/feedbacks"]}>
      <SiteChrome
        breadcrumbs={[
          { label: "首页", to: "/" },
          { label: "管理员看板" },
        ]}
      />
    </MemoryRouter>,
  );

  expect(screen.getByRole("link", { name: "管理员" })).toHaveAttribute("href", "/admin/feedbacks");
  expect(screen.getByRole("button", { name: "退出" })).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "退出" }));

  expect(localStorage.getItem("techvoice-admin-token")).toBeNull();
  expect(screen.getByRole("link", { name: "管理员登录" })).toHaveAttribute("href", "/admin/login");
});

it("shows a tenant lounge entry when browsing tenant-scoped pages", () => {
  mockMatchMedia(true);

  render(
    <MemoryRouter initialEntries={["/t/kuaishou/admin/login"]}>
      <SiteChrome
        breadcrumbs={[
          { label: "首页", to: "/" },
          { label: "租户管理登录" },
        ]}
      />
    </MemoryRouter>,
  );

  expect(screen.getByRole("link", { name: "会客厅" })).toHaveAttribute("href", "/t/kuaishou/lounge");
  const navLinks = screen.getAllByRole("link").map((element) => element.textContent);
  expect(navLinks.indexOf("会客厅")).toBeLessThan(navLinks.indexOf("我要吐槽"));
});
