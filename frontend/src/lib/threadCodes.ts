export const THREAD_CODE_STORAGE_KEY = "techvoice-thread-codes";

function normalizeThreadCode(threadCode: string) {
  return threadCode.trim().toUpperCase();
}

export function readSavedThreadCodes() {
  const stored = localStorage.getItem(THREAD_CODE_STORAGE_KEY);

  if (!stored) {
    return [] as string[];
  }

  try {
    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return [] as string[];
    }

    return parsed.filter((value): value is string => typeof value === "string" && value.trim().length > 0);
  } catch {
    return [] as string[];
  }
}

export function saveThreadCode(threadCode: string) {
  const normalizedThreadCode = normalizeThreadCode(threadCode);

  if (!normalizedThreadCode) {
    return readSavedThreadCodes();
  }

  const existing = readSavedThreadCodes().filter((value) => value !== normalizedThreadCode);
  const next = [normalizedThreadCode, ...existing];
  localStorage.setItem(THREAD_CODE_STORAGE_KEY, JSON.stringify(next));
  return next;
}
