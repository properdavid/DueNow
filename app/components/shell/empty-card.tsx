import type { LucideIcon } from "lucide-react";

interface EmptyCardProps {
  headline: string;
  line: string;
  Mark: LucideIcon;
  headingLevel?: "h1" | "h2";
}

export function EmptyCard({ headline, line, Mark, headingLevel = "h1" }: EmptyCardProps) {
  const Heading = headingLevel;

  return (
    <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 text-center text-card-foreground">
      <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-full bg-primary-soft text-primary">
        <Mark aria-hidden="true" />
        </div>
        <Heading className="text-lg font-semibold">{headline}</Heading>
        <p className="mt-2 text-sm text-muted-foreground">{line}</p>
    </div>
  );
}
