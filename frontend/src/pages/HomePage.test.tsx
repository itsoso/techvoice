import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";

import HomePage from "./HomePage";

it("renders both employee entry cards", () => {
  render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  );

  expect(screen.getByText("我要吐槽")).toBeInTheDocument();
  expect(screen.getByText("我有提案")).toBeInTheDocument();
});
