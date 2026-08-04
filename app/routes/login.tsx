import type { Route } from "./+types/login";
import { Button } from "~/components/ui/button";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Sign in · DueNow" }];
}

export function loader({ request }: Route.LoaderArgs) {
  const attemptedEmail = new URL(request.url).searchParams.get("email");
  return { attemptedEmail, devAuthAvailable: process.env.NODE_ENV !== "production" };
}

export default function Login({ loaderData }: Route.ComponentProps) {
  const attemptedEmail = loaderData.attemptedEmail;
  const isRejected = Boolean(attemptedEmail);
  const button = isRejected ? (
    <Button asChild className="w-full">
      <a href="/login">Try another account</a>
    </Button>
  ) : loaderData.devAuthAvailable ? (
    <form action="/auth/google" method="post">
      <Button className="w-full" type="submit">
        Continue with Google
      </Button>
    </form>
  ) : (
    <Button asChild className="w-full">
      <a href="/auth/google">Continue with Google</a>
    </Button>
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <section className="w-full max-w-sm space-y-4">
        <h1 className="font-semibold tracking-[-0.025em] text-primary" style={{ fontSize: "26px" }}>DueNow</h1>
        <div className="rounded-lg border border-border bg-card p-6 text-card-foreground">
          <div className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">
                {isRejected ? "You can't sign in here" : "Your household\u2019s work, in one place"}
              </h2>
              {isRejected ? (
                <p className="text-xs text-muted-foreground">
                  {attemptedEmail} isn&rsquo;t one of the accounts set up for this household. If you have another Google
                  account, try that one — otherwise ask whoever set this up to add you.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">Only accounts set up for this household can sign in.</p>
              )}
            </div>
            {button}
          </div>
        </div>
      </section>
    </main>
  );
}
