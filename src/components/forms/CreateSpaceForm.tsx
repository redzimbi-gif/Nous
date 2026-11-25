"use client";

import { useActionState } from "react";
import { createSpace, type FormState } from "@/actions/spaces";
import { Field, TonePicker } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { SPACE_TYPE_INFO } from "@/lib/theme";
import { SPACE_TYPES } from "@/lib/types";

export function CreateSpaceForm() {
  const [state, action] = useActionState<FormState, FormData>(createSpace, {});
  return (
    <form action={action} className="space-y-6">
      <fieldset className="space-y-2.5">
        <legend className="pb-1 text-sm font-semibold">Type d&apos;espace</legend>
        {SPACE_TYPES.map((type) => {
          const info = SPACE_TYPE_INFO[type];
          return (
            <label key={type} data-space-type={type} className="relative block cursor-pointer">
              <input type="radio" name="type" value={type} defaultChecked={type === "couple"} className="peer sr-only" />
              <span className="flex items-center gap-4 rounded-3xl bg-surface p-4 shadow-card ring-1 ring-line transition peer-checked:ring-2 peer-checked:ring-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-tint text-tint-ink">
                  <Icon name={info.icon} size={24} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-lg font-semibold">{info.label}</span>
                  <span className="block text-sm text-muted">{info.tagline}</span>
                </span>
              </span>
            </label>
          );
        })}
      </fieldset>
      <Field label="Nom de l'espace" name="name" maxLength={60} required placeholder="Ex. Léo & Camille" />
      <Field label="Ton prénom dans cet espace" name="displayName" maxLength={40} required placeholder="Léo" autoComplete="given-name" />
      <TonePicker />
      {state.error && (
        <p role="alert" className="text-sm font-semibold text-danger">
          {state.error}
        </p>
      )}
      <SubmitButton size="lg" block pendingLabel="Création…">
        Créer l&apos;espace
      </SubmitButton>
    </form>
  );
}
