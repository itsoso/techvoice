import { render, screen } from "@testing-library/react";

import App from "./App";

afterEach(() => {
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
});
