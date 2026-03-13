import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";

import VentSubmitPage from "./VentSubmitPage";

it("renders the vent submission form", () => {
  render(
    <MemoryRouter>
      <VentSubmitPage />
    </MemoryRouter>,
  );

  expect(screen.getByPlaceholderText(/写下你观察到的问题/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /加密提交/i })).toBeInTheDocument();
});
