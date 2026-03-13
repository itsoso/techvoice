import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";

import TrackLookupPage from "./TrackLookupPage";
import { THREAD_CODE_STORAGE_KEY } from "../lib/threadCodes";

afterEach(() => {
  localStorage.clear();
});

it("shows saved thread codes from localStorage and explains that they stay in the browser only", async () => {
  localStorage.setItem(THREAD_CODE_STORAGE_KEY, JSON.stringify(["ECH-AB12CD", "ECH-EF34GH"]));
  const user = userEvent.setup();

  render(
    <MemoryRouter initialEntries={["/track"]}>
      <Routes>
        <Route path="/track" element={<TrackLookupPage />} />
        <Route path="/track/:threadCode" element={<div>时间线详情</div>} />
      </Routes>
    </MemoryRouter>,
  );

  expect(screen.getByText(/只保存在当前浏览器的 localStorage 中/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "ECH-AB12CD" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "ECH-EF34GH" })).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "ECH-AB12CD" }));

  expect(screen.getByText("时间线详情")).toBeInTheDocument();
});
