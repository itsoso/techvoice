const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";

type JsonValue = Record<string, unknown> | Array<unknown> | string | number | boolean | null;

export async function apiRequest<TResponse>(
  path: string,
  options: RequestInit = {},
): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as JsonValue | null;
    throw new Error(
      typeof errorBody === "object" && errorBody !== null && "detail" in errorBody
        ? String(errorBody.detail)
        : "请求失败",
    );
  }

  return (await response.json()) as TResponse;
}
