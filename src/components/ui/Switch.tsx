import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

/** Interrupteur accessible : un formulaire dont l'action serveur inverse l'état. */
export function SwitchForm({ action, label, checked, disabled }: { action: () => void | Promise<void>; label: string; checked: boolean; disabled?: boolean }) {
  return (
    <form action={action}>
      <button
        type="submit"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        className={cn(
          "relative flex h-8 w-14 shrink-0 items-center rounded-full p-1 transition-colors duration-200 disabled:opacity-50",
          checked ? "bg-tint" : "bg-ink/10",
        )}
      >
        <span
          className={cn(
            "flex size-6 items-center justify-center rounded-full shadow-sm transition-transform duration-200",
            checked ? "translate-x-6 bg-primary text-primary-on" : "translate-x-0 bg-subtle text-surface",
          )}
        >
          <Icon name={checked ? "check" : "x"} size={14} strokeWidth={3} />
        </span>
      </button>
    </form>
  );
}
