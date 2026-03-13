import {
  applyThemePreference,
  readThemePreference,
  resolveTheme,
  saveThemePreference,
  THEME_EXPLICIT_KEY,
  THEME_STORAGE_KEY,
} from "./theme";

function mockMatchMedia(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation(() => ({
      matches,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

afterEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
  vi.unstubAllGlobals();
});

it("defaults to dark when there is no saved preference", () => {
  expect(readThemePreference()).toBe("dark");
});

it("resolves system theme from the current media query", () => {
  expect(resolveTheme("system", true)).toBe("dark");
  expect(resolveTheme("system", false)).toBe("light");
});

it("treats legacy system preference as dark by default", () => {
  localStorage.setItem(THEME_STORAGE_KEY, "system");

  expect(readThemePreference()).toBe("dark");
});

it("saves and reapplies an explicit theme preference", () => {
  mockMatchMedia(false);

  saveThemePreference("dark");

  expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
  expect(localStorage.getItem(THEME_EXPLICIT_KEY)).toBe("1");
  expect(readThemePreference()).toBe("dark");
  expect(applyThemePreference("dark")).toBe("dark");
  expect(document.documentElement.dataset.theme).toBe("dark");
});

it("preserves system when the user explicitly chooses it", () => {
  saveThemePreference("system");

  expect(readThemePreference()).toBe("system");
});
