import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";

import AdminLoginPage from "./AdminLoginPage";

it("renders admin login form fields", () => {
  render(
    <MemoryRouter>
      <AdminLoginPage />
    </MemoryRouter>,
  );

  expect(screen.getByLabelText(/用户名/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/密码/i)).toBeInTheDocument();
});
