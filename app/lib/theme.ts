export type Theme = "light" | "dark" | "system";

export const THEME_KEY = "nomagoride.theme";

/** Runs in <head> before React hydrates to avoid theme flash. Serialized as a string. */
export const THEME_BOOTSTRAP_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem(${JSON.stringify(THEME_KEY)});
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = stored === 'light' || stored === 'dark' ? stored : (prefersDark ? 'dark' : 'light');
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  } catch (_) {}
})();
`;

export function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  const v = window.localStorage.getItem(THEME_KEY);
  return v === "light" || v === "dark" ? v : "system";
}

export function resolvedTheme(t: Theme): "light" | "dark" {
  if (t !== "system") return t;
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(t: Theme): void {
  if (typeof document === "undefined") return;
  const resolved = resolvedTheme(t);
  document.documentElement.classList.toggle("dark", resolved === "dark");
  if (t === "system") window.localStorage.removeItem(THEME_KEY);
  else window.localStorage.setItem(THEME_KEY, t);
}
