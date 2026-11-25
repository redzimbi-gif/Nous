"use client";

import { useActionState } from "react";
import { updateProfile, type FormState } from "@/actions/space";
import { Field, TonePicker } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { Tone } from "@/lib/types";

export function ProfileForm({ spaceId, displayName, tone }: { spaceId: string; displayName: string; tone: Tone }) {
  const [state, action] = useActionState<FormState, FormData>(updateProfile.bind(null, spaceId), {});
  return (
    <form action={action} className="space-y-5">
      <Field label="Prénom affiché" name="displayName" defaultValue={displayName} maxLength={40} required />
      <TonePicker defaultValue={tone} />
      {state.error && (
        <p role="alert" className="text-sm font-semibold text-danger">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p role="status" className="text-sm font-semibold text-ok-ink">
          Enregistré.
        </p>
      )}
      <SubmitButton variant="soft" pendingLabel="Enregistrement…">
        Enregistrer
      </SubmitButton>
    </form>
  );
}
