import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";

import HomePage from "./HomePage";

it("renders both employee entry cards", () => {
  render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  );

  expect(screen.getByRole("heading", { level: 2, name: "我要吐槽" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { level: 2, name: "我有提案" })).toBeInTheDocument();
});

it("uses the compact section title style for Echo｜TechVoice", () => {
  render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  );

  expect(screen.getByRole("heading", { level: 1, name: "Echo｜TechVoice" })).toHaveClass("section-title");
});
