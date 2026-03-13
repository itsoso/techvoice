export const THEME_STORAGE_KEY = "techvoice-theme-preference";
export const THEME_EXPLICIT_KEY = "techvoice-theme-explicit";

export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export function readThemePreference(): ThemePreference {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  const isExplicit = localStorage.getItem(THEME_EXPLICIT_KEY) === "1";

  if (stored === "light" || stored === "dark") {
    return stored;
  }

  if (stored === "system" && isExplicit) {
    return stored;
  }

  return "dark";
}

export function saveThemePreference(preference: ThemePreference) {
  localStorage.setItem(THEME_STORAGE_KEY, preference);
  localStorage.setItem(THEME_EXPLICIT_KEY, "1");
}

function getSystemPrefersDark() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia("(prefers-color-scheme: dark)")?.matches ?? false;
}

export function resolveTheme(preference: ThemePreference, systemPrefersDark = getSystemPrefersDark()): ResolvedTheme {
  if (preference === "system") {
    return systemPrefersDark ? "dark" : "light";
  }

  return preference;
}

export function applyThemePreference(preference: ThemePreference): ResolvedTheme {
  const resolvedTheme = resolveTheme(preference);
  document.documentElement.dataset.theme = resolvedTheme;
  document.documentElement.style.colorScheme = resolvedTheme;
  return resolvedTheme;
}

export function initializeTheme() {
  return applyThemePreference(readThemePreference());
}
