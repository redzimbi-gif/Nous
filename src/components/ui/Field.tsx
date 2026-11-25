import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { TONES, type Tone } from "@/lib/types";
import { Icon } from "./Icon";

export function Field({
  label,
  hint,
  error,
  className,
  id,
  ...input
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; error?: string }) {
  const fieldId = id ?? input.name;
  return (
    <div className="space-y-1.5">
      <label htmlFor={fieldId} className="block text-sm font-semibold text-ink">
        {label}
      </label>
      <input
        id={fieldId}
        className={cn(
          "h-14 w-full rounded-2xl border-0 bg-surface px-4 text-[17px] text-ink shadow-card ring-1 ring-line placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-primary",
          className,
        )}
        {...input}
      />
      {hint && <p className="text-sm text-muted">{hint}</p>}
      {error && (
        <p role="alert" className="text-sm font-semibold text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

const TONE_LABEL: Record<Tone, string> = { lilac: "Lilas", rose: "Rose", sun: "Soleil", mint: "Menthe", sky: "Ciel", peach: "Pêche" };

/** Choix de couleur du profil : boutons radio natifs, sans JavaScript. */
export function TonePicker({ name = "color", defaultValue = "lilac", label = "Ta couleur" }: { name?: string; defaultValue?: Tone; label?: string }) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold text-ink">{label}</legend>
      <div className="flex flex-wrap gap-3">
        {TONES.map((tone) => (
          <label key={tone} className="relative cursor-pointer">
            <input type="radio" name={name} value={tone} defaultChecked={tone === defaultValue} className="peer sr-only" />
            <span
              className={cn(
                `tone-${tone}`,
                "flex size-11 items-center justify-center rounded-full bg-tone-bg text-tone-ink ring-offset-2 ring-offset-bg transition peer-checked:ring-2 peer-checked:ring-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary [&>svg]:scale-0 [&>svg]:transition peer-checked:[&>svg]:scale-100",
              )}
            >
              <Icon name="check" size={18} strokeWidth={2.6} />
            </span>
            <span className="sr-only">{TONE_LABEL[tone]}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
