"use client";

import { useCallback, useEffect, useMemo, useState, type SetStateAction } from "react";

type TabOption = "charts" | "table" | "tool-test-info" | "drag-and-drop";

/**
 * Sync a tab state with the URL (?tab=) and localStorage.
 * Priority: URL > localStorage > defaultTab.
 * Updates push state without full navigation.
 */
export function useSyncedTab(
  storageKey: string,
  defaultTab: TabOption = "tool-test-info"
) {
  const getUrlTab = useCallback((): TabOption | null => {
    if (typeof window === "undefined") return null;
    const url = new URL(window.location.href);
    const tab = url.searchParams.get("tab");
    if (tab === "charts" || tab === "table" || tab === "tool-test-info" || tab === "drag-and-drop") {
      return tab;
    }
    return null;
  }, []);

  const getStoredTab = useCallback((): TabOption | null => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return null;
      if (raw === "charts" || raw === "table" || raw === "tool-test-info" || raw === "drag-and-drop") {
        return raw;
      }
      return null;
    } catch {
      return null;
    }
  }, [storageKey]);

  const initialTab: TabOption = useMemo(() => {
    return getUrlTab() ?? getStoredTab() ?? defaultTab;
  }, [getUrlTab, getStoredTab, defaultTab]);

  const [tab, setTab] = useState<TabOption>(initialTab);

  // When URL changes externally (back/forward), keep state in sync
  useEffect(() => {
    const onPopState = () => {
      const t = getUrlTab();
      if (t) setTab(t);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [getUrlTab]);

  // Persist to localStorage whenever tab changes
  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, tab);
    } catch {}
  }, [storageKey, tab]);

  const setSyncedTab = useCallback((value: SetStateAction<TabOption>) => {
    setTab((prev) => {
      const next = typeof value === "function" ? (value as (prev: TabOption) => TabOption)(prev) : value;
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.set("tab", next);
        window.history.replaceState({}, "", url.toString());
        try {
          window.localStorage.setItem(storageKey, next);
        } catch {}
      }
      return next;
    });
  }, [storageKey]);

  return [tab, setSyncedTab] as const;
}


