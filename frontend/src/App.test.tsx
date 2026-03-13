import { render, screen } from "@testing-library/react";

import App from "./App";

it("renders application shell", () => {
  render(<App />);

  expect(screen.getByText(/Echo｜TechVoice/i)).toBeInTheDocument();
});
