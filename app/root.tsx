import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useRouteError,
  Link,
} from "@remix-run/react";
import type { LinksFunction } from "@remix-run/cloudflare";
import { Bus } from "lucide-react";

import tailwindHref from "./tailwind.css?url";
import { THEME_BOOTSTRAP_SCRIPT } from "~/lib/theme";
import { ThemeToggle } from "~/components/ThemeToggle";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: tailwindHref },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Geist+Mono:wght@100..900&display=swap",
  },
] as const;

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Nomago Ride — Slovenian bus schedule, the way it should be</title>
        <Meta />
        <Links />
        <script
          // Set theme class before hydration to avoid flash.
          dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }}
        />
      </head>
      <body>
        <header className="sticky top-0 z-30 border-b border-border bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground shadow-sm transition group-hover:scale-105">
                <Bus className="h-4 w-4" strokeWidth={2.5} />
              </span>
              <span className="text-lg font-semibold tracking-tight">Nomago Ride</span>
            </Link>
            <div className="flex items-center gap-1">
              <span className="hidden text-xs text-muted-foreground sm:inline">
                Data: vozovnice.nomago.si
              </span>
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-5 sm:py-7 animate-fade-in">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 pb-6 pt-3 text-xs text-muted-foreground">
          Unofficial. Bus timetable data sourced from{" "}
          <a
            className="underline underline-offset-2 hover:text-foreground"
            href="https://vozovnice.nomago.si/"
            target="_blank"
            rel="noreferrer"
          >
            vozovnice.nomago.si
          </a>
          . Not affiliated with Nomago.
        </footer>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary() {
  const error = useRouteError();
  if (isRouteErrorResponse(error)) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-foreground">
        <div className="text-xs font-medium uppercase tracking-wider text-destructive">
          Error {error.status}
        </div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{error.statusText}</h1>
        {error.data ? <p className="mt-2 text-sm text-muted-foreground">{String(error.data)}</p> : null}
        <Link to="/" className="mt-4 inline-block text-sm underline-offset-2 hover:underline">
          ← Back to search
        </Link>
      </div>
    );
  }
  const message = error instanceof Error ? error.message : "Something went wrong.";
  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Unexpected error</h1>
      <pre className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{message}</pre>
      <Link to="/" className="mt-4 inline-block text-sm underline-offset-2 hover:underline">
        ← Back to search
      </Link>
    </div>
  );
}
