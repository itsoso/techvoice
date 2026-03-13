import { apiRequest } from "./client";

export type LoungeEvent = {
  id: number;
  title: string;
  description: string | null;
  ticket_open_at: string;
  start_at: string;
  end_at: string;
  ticket_limit: number;
  status: string;
  created_at?: string;
};

export type LoungeTicketResponse = {
  ticket_code: string;
  entry_token: string;
  alias_label: string;
};

export type LoungeEnterResponse = {
  ticket_code: string;
  alias_label: string;
  session_id: number;
  entered: boolean;
};

export type ExecutiveRead = {
  id: number;
  name: string;
  email: string;
  title: string;
  approval_status: string;
  created_at: string;
};

export type QueueItem = {
  session_id: number;
  event_id: number;
  alias_label: string;
  entered_at: string | null;
  created_at: string;
};

export type LoungeSessionClaimResponse = {
  session_id: number;
  status: string;
};

export type TokenResponse = {
  access_token: string;
  token_type: string;
};

const LOUNGE_FINGERPRINT_KEY = "techvoice-lounge-fingerprint";
const EXECUTIVE_TOKEN_KEY = "techvoice-executive-token";
const TENANT_ADMIN_TOKEN_KEY = "techvoice-tenant-admin-token";

export function getLoungeFingerprint() {
  const existing = localStorage.getItem(LOUNGE_FINGERPRINT_KEY);
  if (existing) {
    return existing;
  }

  const created = crypto.randomUUID();
  localStorage.setItem(LOUNGE_FINGERPRINT_KEY, created);
  return created;
}

export async function getCurrentLoungeEvent(tenantSlug: string) {
  return apiRequest<LoungeEvent>(`/tenants/${tenantSlug}/lounge-events/current`);
}

export async function claimLoungeTicket(tenantSlug: string, eventId: string) {
  return apiRequest<LoungeTicketResponse>(`/tenants/${tenantSlug}/lounge-events/${eventId}/claim-ticket`, {
    method: "POST",
    headers: {
      "x-lounge-fingerprint": getLoungeFingerprint(),
    },
  });
}

export async function enterLounge(tenantSlug: string, eventId: string, ticket: LoungeTicketResponse) {
  return apiRequest<LoungeEnterResponse>(`/tenants/${tenantSlug}/lounge-events/${eventId}/enter`, {
    method: "POST",
    headers: {
      "x-lounge-fingerprint": getLoungeFingerprint(),
    },
    body: JSON.stringify({
      ticket_code: ticket.ticket_code,
      entry_token: ticket.entry_token,
    }),
  });
}

export async function registerExecutive(
  tenantSlug: string,
  payload: { name: string; email: string; title: string; password: string },
) {
  return apiRequest<ExecutiveRead>(`/tenants/${tenantSlug}/executives/register`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function executiveLogin(tenantSlug: string, email: string, password: string) {
  return apiRequest<TokenResponse>(`/tenants/${tenantSlug}/executives/login`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

function executiveAuthHeaders(tenantSlug: string) {
  return {
    Authorization: `Bearer ${getExecutiveToken(tenantSlug) ?? ""}`,
  };
}

function tenantAdminAuthHeaders(tenantSlug: string) {
  return {
    Authorization: `Bearer ${getTenantAdminToken(tenantSlug) ?? ""}`,
  };
}

function scopedTokenKey(prefix: string, tenantSlug: string) {
  return `${prefix}:${tenantSlug}`;
}

export function getExecutiveToken(tenantSlug: string) {
  return localStorage.getItem(scopedTokenKey(EXECUTIVE_TOKEN_KEY, tenantSlug));
}

export function setExecutiveToken(tenantSlug: string, token: string) {
  localStorage.setItem(scopedTokenKey(EXECUTIVE_TOKEN_KEY, tenantSlug), token);
}

export function clearExecutiveToken(tenantSlug: string) {
  localStorage.removeItem(scopedTokenKey(EXECUTIVE_TOKEN_KEY, tenantSlug));
}

export async function listExecutiveQueue(tenantSlug: string) {
  return apiRequest<{ items: QueueItem[] }>(`/tenants/${tenantSlug}/executive/lounge-queue`, {
    headers: executiveAuthHeaders(tenantSlug),
  });
}

export async function claimExecutiveSession(tenantSlug: string, sessionId: number) {
  return apiRequest<LoungeSessionClaimResponse>(`/tenants/${tenantSlug}/executive/lounge-sessions/${sessionId}/claim`, {
    method: "POST",
    headers: executiveAuthHeaders(tenantSlug),
  });
}

export async function tenantAdminLogin(tenantSlug: string, username: string, password: string) {
  return apiRequest<TokenResponse>(`/tenants/${tenantSlug}/admin/auth/login`, {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export function getTenantAdminToken(tenantSlug: string) {
  return localStorage.getItem(scopedTokenKey(TENANT_ADMIN_TOKEN_KEY, tenantSlug));
}

export function setTenantAdminToken(tenantSlug: string, token: string) {
  localStorage.setItem(scopedTokenKey(TENANT_ADMIN_TOKEN_KEY, tenantSlug), token);
}

export function clearTenantAdminToken(tenantSlug: string) {
  localStorage.removeItem(scopedTokenKey(TENANT_ADMIN_TOKEN_KEY, tenantSlug));
}

export async function listTenantExecutives(tenantSlug: string) {
  return apiRequest<{ items: ExecutiveRead[] }>(`/tenants/${tenantSlug}/admin/executives`, {
    headers: tenantAdminAuthHeaders(tenantSlug),
  });
}

export async function approveTenantExecutive(tenantSlug: string, executiveId: number) {
  return apiRequest<ExecutiveRead>(`/tenants/${tenantSlug}/admin/executives/${executiveId}/approve`, {
    method: "POST",
    headers: tenantAdminAuthHeaders(tenantSlug),
  });
}

export async function listTenantLoungeEvents(tenantSlug: string) {
  return apiRequest<{ items: LoungeEvent[] }>(`/tenants/${tenantSlug}/admin/lounge-events`, {
    headers: tenantAdminAuthHeaders(tenantSlug),
  });
}

export async function createTenantLoungeEvent(
  tenantSlug: string,
  payload: {
    title: string;
    description: string;
    ticket_open_at: string;
    start_at: string;
    end_at: string;
    ticket_limit: number;
  },
) {
  return apiRequest<LoungeEvent>(`/tenants/${tenantSlug}/admin/lounge-events`, {
    method: "POST",
    headers: tenantAdminAuthHeaders(tenantSlug),
    body: JSON.stringify(payload),
  });
}

export function resolveWebSocketBaseUrl(origin?: string) {
  const resolvedOrigin = origin ?? window.location.origin;
  if (resolvedOrigin.startsWith("https://")) {
    return `wss://${resolvedOrigin.slice("https://".length)}/api/v1`;
  }
  if (resolvedOrigin.startsWith("http://")) {
    return `ws://${resolvedOrigin.slice("http://".length)}/api/v1`;
  }
  return "/api/v1";
}

export function buildParticipantWebSocketUrl(
  tenantSlug: string,
  eventId: string,
  ticket: LoungeTicketResponse,
  origin?: string,
) {
  const base = resolveWebSocketBaseUrl(origin);
  return `${base}/ws/tenants/${tenantSlug}/lounge-events/${eventId}/participant?ticket_code=${encodeURIComponent(ticket.ticket_code)}&entry_token=${encodeURIComponent(ticket.entry_token)}`;
}

export function buildExecutiveWebSocketUrl(tenantSlug: string, accessToken: string, origin?: string) {
  const base = resolveWebSocketBaseUrl(origin);
  if (base.startsWith("ws")) {
    return `${base}/ws/tenants/${tenantSlug}/executive/lounge?access_token=${encodeURIComponent(accessToken)}`;
  }
  return `${base}/ws/tenants/${tenantSlug}/executive/lounge?access_token=${encodeURIComponent(accessToken)}`;
}
