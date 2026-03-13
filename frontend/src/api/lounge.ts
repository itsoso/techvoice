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
};

export type LoungeTicketResponse = {
  ticket_code: string;
  entry_token: string;
  alias_label: string;
};

const LOUNGE_FINGERPRINT_KEY = "techvoice-lounge-fingerprint";

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
