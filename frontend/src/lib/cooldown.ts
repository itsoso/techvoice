const LAST_SUBMIT_KEY = "techvoice:last-submit-at";
const WINDOW_MS = 10 * 60 * 1000;

export function markSubmissionTime(timestamp: number) {
  localStorage.setItem(LAST_SUBMIT_KEY, String(timestamp));
}

export function isCooldownActive(now: number) {
  const value = localStorage.getItem(LAST_SUBMIT_KEY);
  if (!value) {
    return false;
  }

  return now - Number(value) < WINDOW_MS;
}
