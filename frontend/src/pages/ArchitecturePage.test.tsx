import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import ArchitecturePage from "./ArchitecturePage";

it("renders a full repository snapshot instead of stale hard-coded counts", () => {
  render(
    <MemoryRouter>
      <ArchitecturePage />
    </MemoryRouter>,
  );

  expect(screen.getByRole("heading", { level: 1, name: "系统架构" })).toBeInTheDocument();
  expect(screen.getByText("前端生产代码")).toBeInTheDocument();
  expect(screen.getByText("后端生产代码")).toBeInTheDocument();
  expect(screen.getByText("测试代码")).toBeInTheDocument();
  expect(screen.getByText("文档与静态资源")).toBeInTheDocument();
  expect(screen.getByText("当前快照总计")).toBeInTheDocument();
  expect(screen.getByText("tenants")).toBeInTheDocument();
  expect(screen.getByText("lounge_sessions")).toBeInTheDocument();
  expect(screen.queryByText("2,722 行")).not.toBeInTheDocument();
  expect(screen.queryByText("915 行")).not.toBeInTheDocument();
});
