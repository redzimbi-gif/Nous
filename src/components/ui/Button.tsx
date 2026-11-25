import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "soft" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex select-none items-center justify-center gap-2 rounded-full font-display font-semibold transition duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-primary-on shadow-press hover:brightness-105",
  soft: "bg-tint text-tint-ink hover:brightness-[0.97]",
  ghost: "text-primary-ink hover:bg-tint/60",
  danger: "bg-danger-soft text-danger hover:brightness-[0.97]",
};

const sizes: Record<Size, string> = {
  sm: "h-10 px-4 text-sm",
  md: "h-12 px-6 text-base",
  lg: "h-14 px-7 text-[17px]",
};

interface StyleProps {
  variant?: Variant;
  size?: Size;
  block?: boolean;
}

export function buttonClass({ variant = "primary", size = "md", block = false, className }: StyleProps & { className?: string }) {
  return cn(base, variants[variant], sizes[size], block && "w-full", className);
}

export function Button({ variant, size, block, className, type = "button", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & StyleProps) {
  return <button type={type} className={buttonClass({ variant, size, block, className })} {...props} />;
}

export function ButtonLink({ variant, size, block, className, ...props }: ComponentProps<typeof Link> & StyleProps) {
  return <Link className={buttonClass({ variant, size, block, className })} {...props} />;
}
