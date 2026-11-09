import {
  isThemePreference,
  readStoredTheme,
  resolveTheme,
  THEME_STORAGE_KEY,
  writeStoredTheme,
} from "./theme";

describe("theme preferences", () => {
  beforeEach(() => window.localStorage.clear());

  it("accepts only the three supported preferences", () => {
    expect(isThemePreference("light")).toBe(true);
    expect(isThemePreference("dark")).toBe(true);
    expect(isThemePreference("system")).toBe(true);
    expect(isThemePreference("sepia")).toBe(false);
    expect(isThemePreference(null)).toBe(false);
  });

  it("falls back to system when storage is empty or corrupted", () => {
    expect(readStoredTheme()).toBe("system");
    window.localStorage.setItem(THEME_STORAGE_KEY, "weird");
    expect(readStoredTheme()).toBe("system");
  });

  it("persists explicit choices and clears the key for system", () => {
    writeStoredTheme("dark");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(readStoredTheme()).toBe("dark");

    writeStoredTheme("system");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it("resolves system to the OS preference and leaves explicit themes alone", () => {
    expect(resolveTheme("light")).toBe("light");
    expect(resolveTheme("dark")).toBe("dark");
    // The jsdom matchMedia stub reports a light OS theme.
    expect(resolveTheme("system")).toBe("light");
  });
});
