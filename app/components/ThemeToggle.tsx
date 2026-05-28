import { useEffect, useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "~/components/ui/button";
import { applyTheme, readStoredTheme, resolvedTheme, type Theme } from "~/lib/theme";

const ORDER: Theme[] = ["light", "dark", "system"];

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(readStoredTheme());
    setMounted(true);
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (readStoredTheme() === "system") applyTheme("system");
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  function cycle() {
    const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
    setTheme(next);
    applyTheme(next);
  }

  const resolved = mounted ? resolvedTheme(theme) : "light";
  const label =
    theme === "system" ? `System (${resolved})` : theme === "dark" ? "Dark" : "Light";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycle}
      aria-label={`Switch theme — currently ${label}`}
      title={label}
      className="rounded-full"
    >
      {!mounted ? (
        <Sun className="h-4 w-4" />
      ) : theme === "light" ? (
        <Sun className="h-4 w-4" />
      ) : theme === "dark" ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Monitor className="h-4 w-4" />
      )}
    </Button>
  );
}
