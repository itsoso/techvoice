import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";

import SuccessPage from "./SuccessPage";
import { THREAD_CODE_STORAGE_KEY } from "../lib/threadCodes";

afterEach(() => {
  localStorage.clear();
});

it("stores the submitted thread code in localStorage and explains the storage scope", () => {
  render(
    <MemoryRouter initialEntries={["/success/ECH-AB12CD"]}>
      <Routes>
        <Route path="/success/:threadCode" element={<SuccessPage />} />
      </Routes>
    </MemoryRouter>,
  );

  expect(localStorage.getItem(THREAD_CODE_STORAGE_KEY)).toBe(JSON.stringify(["ECH-AB12CD"]));
  expect(screen.getByText(/只保存在当前浏览器的 localStorage 中/i)).toBeInTheDocument();
});
