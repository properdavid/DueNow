import type { Route } from "./+types/home";

export function meta(_: Route.MetaArgs) {
  return [{ title: "DueNow" }];
}

export function loader() {
  return { wordmark: "DueNow" };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-4 p-6">
      <h1 className="text-xl font-semibold tracking-[-0.025em] text-primary">
        {loaderData.wordmark}
      </h1>
      <p className="text-base text-muted-foreground">
        Your household&rsquo;s work, in one place.
      </p>
    </main>
  );
}
