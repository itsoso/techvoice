import { render, screen } from "@testing-library/react";

import App from "./App";

it("renders application shell", () => {
  render(<App />);

  expect(screen.getByRole("heading", { name: /Echo｜TechVoice/i })).toBeInTheDocument();
});
