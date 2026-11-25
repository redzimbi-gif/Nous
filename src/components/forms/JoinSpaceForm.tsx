"use client";

import { useActionState } from "react";
import { joinSpace, type FormState } from "@/actions/spaces";
import { Field, TonePicker } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function JoinSpaceForm() {
  const [state, action] = useActionState<FormState, FormData>(joinSpace, {});
  return (
    <form action={action} className="space-y-6">
      <Field label="Code d'invitation" name="code" required autoFocus autoCapitalize="characters" autoCorrect="off" spellCheck={false} maxLength={20} placeholder="NOUS-7K2F-QX9A" className="font-display text-xl tracking-[0.06em]" />
      <Field label="Ton prénom dans cet espace" name="displayName" maxLength={40} required placeholder="Léo" autoComplete="given-name" hint="Tu pourras utiliser un autre prénom dans un autre espace." />
      <TonePicker />
      {state.error && (
        <p role="alert" className="text-sm font-semibold text-danger">
          {state.error}
        </p>
      )}
      <SubmitButton size="lg" block pendingLabel="Un instant…">
        Rejoindre l&apos;espace
      </SubmitButton>
    </form>
  );
}
