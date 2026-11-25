import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Tone = "tint" | "soft" | "warm" | "ok" | "solid";

const tones: Record<Tone, string> = {
  tint: "bg-tint text-tint-ink",
  soft: "bg-surface-2 text-muted",
  warm: "bg-warm text-warm-ink",
  ok: "bg-ok text-ok-ink",
  solid: "bg-primary text-primary-on",
};

export function Chip({ tone = "tint", className, ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold", tones[tone], className)}
      {...props}
    />
  );
}
