import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useMatches,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { Button } from "~/components/ui/button";
import { isUnreachableError } from "~/pwa/unreachable";
import { darkPrimaryIndigoHex, primaryIndigoHex } from "../pwa/manifest";

export const links: Route.LinksFunction = () => [
  { rel: "manifest", href: "/manifest.webmanifest" },
  { rel: "icon", href: "/icons/favicon.svg", type: "image/svg+xml" },
  { rel: "apple-touch-icon", href: "/icons/apple-touch-icon-180.png", sizes: "180x180" },
  { rel: "apple-touch-icon", href: "/icons/apple-touch-icon-167.png", sizes: "167x167" },
  { rel: "apple-touch-icon", href: "/icons/apple-touch-icon-152.png", sizes: "152x152" },
];

export function themeClassNameFor(theme?: "system" | "light" | "dark") {
  return theme === "light" || theme === "dark" ? theme : undefined;
}

type ThemeColorMeta = { name: "theme-color"; content: string; media?: string };

const lightThemeColorMeta: ThemeColorMeta = { name: "theme-color", content: primaryIndigoHex };
const darkThemeColorMeta: ThemeColorMeta = { name: "theme-color", content: darkPrimaryIndigoHex };

export function themeColorMetaFor(theme?: "system" | "light" | "dark") {
  if (theme === "light") return [lightThemeColorMeta];
  if (theme === "dark") return [darkThemeColorMeta];
  return [
    { ...lightThemeColorMeta, media: "(prefers-color-scheme: light)" },
    { ...darkThemeColorMeta, media: "(prefers-color-scheme: dark)" },
  ];
}

export function Layout({ children }: { children: React.ReactNode }) {
  const matches = useMatches();
  const shellData = matches.find((match) => match.id === "routes/shell")?.data as
    | { user?: { theme?: "system" | "light" | "dark" } }
    | undefined;
  const theme = shellData?.user?.theme;
  const themeClassName = themeClassNameFor(theme);

  return (
    <html className={themeClassName} lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {themeColorMetaFor(theme).map((meta) => (
          <meta key={meta.media ?? meta.content} {...meta} />
        ))}
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function isUnreachableRouteError(error: unknown) {
  if (isRouteErrorResponse(error)) {
    return false;
  }
  return isUnreachableError(error);
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  if (isUnreachableRouteError(error)) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-4 p-6">
        <div className="space-y-2 rounded-lg border border-border bg-card p-6 text-card-foreground">
          <h1 className="text-xl font-semibold">Can&apos;t reach DueNow</h1>
          <p className="text-base text-muted-foreground">The server did not answer. Retry when DueNow is reachable again.</p>
          <Button variant="outline" type="button" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </main>
    );
  }

  const heading = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : "Something went wrong";
  const detail = isRouteErrorResponse(error)
    ? error.data
    : error instanceof Error
      ? error.message
      : "An unexpected error occurred.";

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-2 p-6">
      <h1 className="text-xl font-semibold">{heading}</h1>
      <p className="text-base text-muted-foreground">{detail}</p>
    </main>
  );
}
