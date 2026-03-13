import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";

import SiteChrome from "./SiteChrome";

it("renders primary navigation and breadcrumbs", () => {
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
  expect(screen.getByRole("navigation", { name: "面包屑" })).toBeInTheDocument();
  expect(screen.getByRole("navigation", { name: "面包屑" })).toHaveTextContent("查询追踪");
});
