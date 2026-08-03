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

export function Layout({ children }: { children: React.ReactNode }) {
  const matches = useMatches();
  const shellData = matches.find((match) => match.id === "routes/shell")?.data as
    | { user?: { theme?: "system" | "light" | "dark" } }
    | undefined;
  const theme = shellData?.user?.theme;
  const themeClassName = theme === "light" || theme === "dark" ? theme : undefined;

  return (
    <html className={themeClassName} lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
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

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
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
