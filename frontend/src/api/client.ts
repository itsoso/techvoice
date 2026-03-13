export function resolveApiBaseUrl(configuredBaseUrl?: string, origin?: string) {
  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  if (origin) {
    return `${origin}/api/v1`;
  }

  return "/api/v1";
}

const API_BASE_URL = resolveApiBaseUrl(
  import.meta.env.VITE_API_BASE_URL,
  typeof window === "undefined" ? undefined : window.location.origin,
);

type JsonValue = Record<string, unknown> | Array<unknown> | string | number | boolean | null;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function formatErrorDetail(detail: unknown): string {
  if (detail == null) {
    return "请求失败";
  }

  if (typeof detail === "string" || typeof detail === "number" || typeof detail === "boolean") {
    return String(detail);
  }

  if (Array.isArray(detail)) {
    const messages = detail.map((item) => formatErrorDetail(item)).filter(Boolean);
    return messages.length > 0 ? messages.join("; ") : "请求失败";
  }

  if (typeof detail === "object") {
    const record = detail as Record<string, unknown>;

    if (typeof record.msg === "string") {
      const location = Array.isArray(record.loc) ? record.loc.join(".") : "";
      const message =
        record.msg === "Input should be a valid dictionary or object to extract fields from"
          ? "请求参数格式错误，请刷新页面后重试。"
          : record.msg;
      return location && message === record.msg ? `${location}: ${message}` : message;
    }

    if ("detail" in record) {
      return formatErrorDetail(record.detail);
    }

    try {
      return JSON.stringify(record);
    } catch {
      return "请求失败";
    }
  }

  return "请求失败";
}

export async function apiRequest<TResponse>(
  path: string,
  options: RequestInit = {},
): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as JsonValue | null;
    throw new ApiError(formatErrorDetail(errorBody), response.status);
  }

  return (await response.json()) as TResponse;
}
