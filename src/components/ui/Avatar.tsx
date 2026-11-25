import { cn } from "@/lib/cn";
import { initialOf } from "@/lib/format";
import type { Tone } from "@/lib/types";

const sizes = { xs: "size-7 text-xs", sm: "size-9 text-sm", md: "size-11 text-base", lg: "size-14 text-xl", xl: "size-24 text-4xl" } as const;

export function Avatar({ name, tone = "lilac", size = "md", className }: { name: string; tone?: Tone; size?: keyof typeof sizes; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(`tone-${tone}`, "inline-flex shrink-0 select-none items-center justify-center rounded-full bg-tone-bg font-display font-semibold text-tone-ink", sizes[size], className)}
    >
      {initialOf(name)}
    </span>
  );
}
