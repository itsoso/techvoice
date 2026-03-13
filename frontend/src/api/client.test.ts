import { apiRequest, formatErrorDetail, resolveApiBaseUrl } from "./client";

afterEach(() => {
  vi.restoreAllMocks();
});

it("prefers the configured api base url", () => {
  expect(resolveApiBaseUrl("https://api.example.com/v1", "https://site.example.com")).toBe(
    "https://api.example.com/v1",
  );
});

it("falls back to the current origin when no api base url is configured", () => {
  expect(resolveApiBaseUrl(undefined, "https://techvoice.executor.life")).toBe(
    "https://techvoice.executor.life/api/v1",
  );
});

it("uses a relative api path when origin is unavailable", () => {
  expect(resolveApiBaseUrl(undefined)).toBe("/api/v1");
});

it("formats fastapi validation errors into readable text", () => {
  expect(
    formatErrorDetail({
      detail: [
        {
          loc: ["body", "content"],
          msg: "Field required",
        },
      ],
    }),
  ).toBe("body.content: Field required");
});

it("translates raw fastapi object validation errors into user-facing text", () => {
  expect(
    formatErrorDetail({
      detail: [
        {
          loc: ["body"],
          msg: "Input should be a valid dictionary or object to extract fields from",
        },
      ],
    }),
  ).toBe("请求参数格式错误，请刷新页面后重试。");
});

it("preserves json content-type when custom headers are provided", async () => {
  const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
    new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }),
  );

  await apiRequest("/admin/feedbacks/2/reply", {
    method: "POST",
    headers: {
      Authorization: "Bearer demo-token",
    },
    body: JSON.stringify({ content: "67" }),
  });

  const [, requestInit] = fetchMock.mock.calls[0];
  expect(requestInit?.headers).toEqual({
    Authorization: "Bearer demo-token",
    "Content-Type": "application/json",
  });
});
