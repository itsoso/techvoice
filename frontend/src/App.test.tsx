import { render, screen } from "@testing-library/react";

import App from "./App";

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
  window.history.pushState({}, "", "/");
});

it("renders application shell", () => {
  render(<App />);

  expect(screen.getByRole("heading", { name: /Echo｜TechVoice/i })).toBeInTheDocument();
});

it("renders the public architecture page", () => {
  window.history.pushState({}, "", "/architecture");

  render(<App />);

  expect(screen.getByRole("heading", { level: 1, name: "系统架构" })).toBeInTheDocument();
  expect(screen.getByRole("region", { name: "代码行数快照" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { level: 2, name: "数据库表结构" })).toBeInTheDocument();
  expect(screen.getByText("feedbacks")).toBeInTheDocument();
  expect(screen.getByText("feedback_events")).toBeInTheDocument();
});

it("redirects expired admin sessions back to the login page", async () => {
  window.history.pushState({}, "", "/admin/feedbacks");
  localStorage.setItem("techvoice-admin-token", "stale-token");

  vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
    new Response(
      JSON.stringify({
        detail: "Invalid token",
      }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      },
    ),
  );

  render(<App />);

  expect(await screen.findByRole("heading", { level: 1, name: "管理员登录" })).toBeInTheDocument();
  expect(localStorage.getItem("techvoice-admin-token")).toBeNull();
});
