type SavedLoungeTicket = {
  ticket_code: string;
  entry_token: string;
  alias_label: string;
};

function storageKey(tenantSlug: string, eventId: string) {
  return `techvoice-lounge-ticket:${tenantSlug}:${eventId}`;
}

export function saveLoungeTicket(tenantSlug: string, eventId: string, ticket: SavedLoungeTicket) {
  localStorage.setItem(storageKey(tenantSlug, eventId), JSON.stringify(ticket));
}

export function getSavedLoungeTicket(tenantSlug: string, eventId: string): SavedLoungeTicket | null {
  const raw = localStorage.getItem(storageKey(tenantSlug, eventId));
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as SavedLoungeTicket;
  } catch {
    return null;
  }
}
