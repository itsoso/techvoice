import { ApiError, apiRequest } from "./client";
import type { FeedbackDetail } from "./feedbacks";
import type { AdminFeedbackStatusFilter, AdminFeedbackTab } from "../lib/adminFeedbackList";

const ADMIN_TOKEN_KEY = "techvoice-admin-token";

export type AdminFeedbackSummary = {
  id: number;
  thread_code: string;
  public_code: string;
  type: "vent" | "proposal";
  category: string;
  status: string;
  is_public: boolean;
  star_count: number;
  title: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminFeedbackListResponse = {
  items: AdminFeedbackSummary[];
  total: number;
  page: number;
  page_size: number;
};

function authHeaders() {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY) ?? "";
  return {
    Authorization: `Bearer ${token}`,
  };
}

export function setAdminToken(token: string) {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function getAdminToken() {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  return token && token.trim() ? token : null;
}

export function clearAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

export function getAdminEntryLink() {
  return getAdminToken()
    ? { label: "管理员", to: "/admin/feedbacks" }
    : { label: "管理员登录", to: "/admin/login" };
}

export function isAdminAuthError(error: unknown) {
  if (error instanceof ApiError) {
    return error.status === 401;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  return /invalid token|not authenticated|could not validate credentials/i.test(error.message);
}

export async function adminLogin(username: string, password: string) {
  return apiRequest<{ access_token: string; token_type: string }>("/admin/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function listAdminFeedbacks(params?: {
  tab?: AdminFeedbackTab;
  status?: AdminFeedbackStatusFilter;
  page?: number;
  pageSize?: number;
}) {
  const search = new URLSearchParams();
  if (params?.tab) {
    search.set("tab", params.tab);
  }
  if (params?.status) {
    search.set("status", params.status);
  }
  if (params?.page) {
    search.set("page", String(params.page));
  }
  if (params?.pageSize) {
    search.set("page_size", String(params.pageSize));
  }

  const query = search.toString();

  return apiRequest<AdminFeedbackListResponse>(`/admin/feedbacks${query ? `?${query}` : ""}`, {
    headers: authHeaders(),
  });
}

export async function getAdminFeedback(feedbackId: string) {
  return apiRequest<FeedbackDetail>(`/admin/feedbacks/${feedbackId}`, {
    headers: authHeaders(),
  });
}

export async function replyAdminFeedback(feedbackId: string, content: string) {
  return apiRequest<{ created: boolean }>(`/admin/feedbacks/${feedbackId}/reply`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ content }),
  });
}

export async function updateAdminFeedbackStatus(feedbackId: string, status: string, reason: string) {
  return apiRequest<AdminFeedbackSummary>(`/admin/feedbacks/${feedbackId}/status`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ status, reason }),
  });
}

export async function publishAdminFeedback(feedbackId: string) {
  return apiRequest<AdminFeedbackSummary>(`/admin/feedbacks/${feedbackId}/publish`, {
    method: "POST",
    headers: authHeaders(),
  });
}

export async function hideAdminFeedback(feedbackId: string) {
  return apiRequest<AdminFeedbackSummary>(`/admin/feedbacks/${feedbackId}/hide`, {
    method: "POST",
    headers: authHeaders(),
  });
}

export async function hideAdminPublicFeedback(publicCode: string) {
  return apiRequest<AdminFeedbackSummary>(`/admin/public-feedbacks/${publicCode}/hide`, {
    method: "POST",
    headers: authHeaders(),
  });
}

export async function restoreAdminFeedback(feedbackId: string) {
  return apiRequest<AdminFeedbackSummary>(`/admin/feedbacks/${feedbackId}/restore`, {
    method: "POST",
    headers: authHeaders(),
  });
}
