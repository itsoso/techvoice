import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";

import ProposalSubmitPage from "./ProposalSubmitPage";

it("renders the proposal submission form", () => {
  render(
    <MemoryRouter>
      <ProposalSubmitPage />
    </MemoryRouter>,
  );

  expect(screen.getByLabelText(/观察到的现象/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/带来的影响/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/我的建议方案/i)).toBeInTheDocument();
});
