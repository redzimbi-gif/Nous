"use client";

export default function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      disabled={disabled}
      className={`relative flex h-9 w-16 shrink-0 items-center rounded-full p-1 transition-colors disabled:opacity-50 ${
        checked ? "bg-grape-100" : "bg-gray-200"
      }`}
    >
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm transition-transform ${
          checked ? "translate-x-7 bg-grape-500" : "translate-x-0 bg-gray-500"
        }`}
      >
        {checked ? "✓" : "✕"}
      </span>
    </button>
  );
}
