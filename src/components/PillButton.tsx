"use client";

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
      className={`rounded-full py-3 font-display text-sm font-semibold tracking-wide transition active:scale-[0.98] disabled:opacity-50 ${
        variant === "solid"
          ? "bg-grape-500 text-white shadow-sm"
          : "bg-grape-50 text-grape-600"
      } ${className}`}
    >
      {children}
    </button>
  );
}
