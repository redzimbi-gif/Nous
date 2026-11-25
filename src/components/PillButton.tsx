"use client";

import { cn } from "@/lib/cn";

export default function PillButton({
  children,
  onClick,
  type = "button",
  disabled,
  variant = "solid",
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  variant?: "solid" | "soft";
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 font-display text-[15px] font-semibold transition duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
        variant === "solid" ? "bg-primary text-primary-on shadow-press hover:brightness-105" : "bg-tint text-tint-ink hover:brightness-[0.97]",
        className,
      )}
    >
      {children}
    </button>
  );
}
