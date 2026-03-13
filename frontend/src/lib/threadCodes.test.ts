import { readSavedThreadCodes, saveThreadCode, THREAD_CODE_STORAGE_KEY } from "./threadCodes";

afterEach(() => {
  localStorage.clear();
});

it("stores only thread codes in newest-first order", () => {
  saveThreadCode("ECH-111111");
  saveThreadCode("ECH-222222");
  saveThreadCode("ECH-111111");

  expect(localStorage.getItem(THREAD_CODE_STORAGE_KEY)).toBe(JSON.stringify(["ECH-111111", "ECH-222222"]));
  expect(readSavedThreadCodes()).toEqual(["ECH-111111", "ECH-222222"]);
});

it("ignores malformed payloads and empty codes", () => {
  localStorage.setItem(THREAD_CODE_STORAGE_KEY, JSON.stringify([{ code: "ECH-123456" }, "ECH-234567"]));

  expect(readSavedThreadCodes()).toEqual(["ECH-234567"]);

  saveThreadCode("   ");

  expect(readSavedThreadCodes()).toEqual(["ECH-234567"]);
});
