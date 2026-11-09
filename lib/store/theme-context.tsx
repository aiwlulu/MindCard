"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import {
  applyTheme,
  readStoredTheme,
  resolveTheme,
  writeStoredTheme,
  type ResolvedTheme,
  type ThemePreference,
} from "@/lib/theme";

interface ThemeContextValue {
  preference: ThemePreference;
  theme: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
}

export const ThemeContext = createContext<ThemeContextValue>({
  preference: "system",
  theme: "light",
  setPreference: () => {},
});

// A tiny external store keeps React in sync with localStorage and the OS theme
// without setting state inside effects; the server snapshot is always light.
const listeners = new Set<() => void>();
const SERVER_SNAPSHOT = "system|light";

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const media =
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia("(prefers-color-scheme: dark)")
      : null;
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key.startsWith("mindcard:theme")) emit();
  };
  media?.addEventListener?.("change", emit);
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    media?.removeEventListener?.("change", emit);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): string {
  const preference = readStoredTheme();
  return `${preference}|${resolveTheme(preference)}`;
}

function getServerSnapshot(): string {
  return SERVER_SNAPSHOT;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [preference, theme] = snapshot.split("|") as [ThemePreference, ResolvedTheme];

  const setPreference = useCallback((next: ThemePreference) => {
    writeStoredTheme(next);
    applyTheme(resolveTheme(next));
    emit();
  }, []);

  // Keep the document attribute aligned when the OS theme flips under "system".
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const value = useMemo(
    () => ({ preference, theme, setPreference }),
    [preference, theme, setPreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
