const LAST_TENANT_SLUG_KEY = "techvoice-last-tenant-slug";

export function readLastTenantSlug() {
  const stored = localStorage.getItem(LAST_TENANT_SLUG_KEY);
  return stored && stored.trim() ? stored : null;
}

export function rememberLastTenantSlug(tenantSlug: string) {
  const normalized = tenantSlug.trim();
  if (!normalized) {
    return;
  }

  localStorage.setItem(LAST_TENANT_SLUG_KEY, normalized);
}

export { LAST_TENANT_SLUG_KEY };
