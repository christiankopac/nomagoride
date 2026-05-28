import { useEffect, useState } from "react";
import { Link } from "@remix-run/react";
import { ArrowRight, Star, X } from "lucide-react";
import { getAll, remove, subscribe, type Favorite } from "~/lib/favorites";
import { todayISO } from "~/lib/format";

export function FavoritesList() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setFavorites(getAll());
    return subscribe(() => setFavorites(getAll()));
  }, []);

  if (!mounted) return null;
  if (favorites.length === 0) return null;

  const today = todayISO();

  return (
    <section className="space-y-3 animate-fade-in">
      <div className="flex items-center gap-2">
        <Star className="h-4 w-4 fill-accent text-accent" />
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Favorite rides
        </h2>
        <span className="text-xs text-muted-foreground/70">— from today onward</span>
      </div>
      <ul className="flex flex-wrap gap-2">
        {favorites.map((f) => {
          const href = `/schedule?from=${encodeURIComponent(
            f.from.id,
          )}&to=${encodeURIComponent(f.to.id)}&date=${today}`;
          return (
            <li key={`${f.from.id}-${f.to.id}`} className="flex">
              <div className="group flex items-center overflow-hidden rounded-full border border-border bg-card text-card-foreground shadow-sm transition hover:border-accent/50 hover:shadow">
                <Link
                  to={href}
                  prefetch="intent"
                  className="flex items-center gap-2 py-2 pl-4 pr-3 text-sm font-medium"
                >
                  <span>{f.from.name}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                  <span>{f.to.name}</span>
                </Link>
                <button
                  type="button"
                  aria-label="Remove favorite"
                  onClick={() => remove(f.from.id, f.to.id)}
                  className="flex h-full items-center px-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                  title="Remove"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
