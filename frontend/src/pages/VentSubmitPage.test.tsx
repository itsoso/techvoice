import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import SuccessPage from "./SuccessPage";
import VentSubmitPage from "./VentSubmitPage";

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

it("renders the vent submission form", () => {
  render(
    <MemoryRouter>
      <VentSubmitPage />
    </MemoryRouter>,
  );

  expect(screen.getByPlaceholderText(/写下你观察到的问题/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /加密提交/i })).toBeInTheDocument();
});

it("submits successfully even if a previous local submit timestamp exists", async () => {
  localStorage.setItem("techvoice:last-submit-at", String(Date.now()));
  vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
    new Response(JSON.stringify({ thread_code: "ECH-AB12CD" }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }),
  );

  const user = userEvent.setup();

  render(
    <MemoryRouter initialEntries={["/submit/vent"]}>
      <Routes>
        <Route path="/submit/vent" element={<VentSubmitPage />} />
        <Route path="/success/:threadCode" element={<SuccessPage />} />
      </Routes>
    </MemoryRouter>,
  );

  await user.type(screen.getByPlaceholderText(/写下你观察到的问题/i), "流水线卡了三十分钟。");
  await user.click(screen.getByRole("button", { name: /加密提交/i }));

  expect(await screen.findByText("ECH-AB12CD")).toBeInTheDocument();
  expect(screen.queryByText(/10 分钟内只能提交 1 次/i)).not.toBeInTheDocument();
});
