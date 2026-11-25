"use client";

import { useActionState } from "react";
import { requestCode, verifyCode, type AuthState } from "@/actions/auth";
import { Field } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";

const initial: AuthState = { step: "email", email: "" };

export function LoginForm({ next }: { next?: string }) {
  const [asked, ask] = useActionState(requestCode, initial);
  const [checked, check] = useActionState(verifyCode, { step: "code", email: "" } as AuthState);

  if (asked.step === "code") {
    return (
      <div className="space-y-6 animate-rise">
        <div>
          <h1 className="font-display text-[34px] font-bold leading-[1.05]">Vérifie ta boîte mail</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">
            Nous avons envoyé un code à <strong className="text-ink">{asked.email}</strong>. Il reste valable quelques minutes.
          </p>
        </div>
        <form action={check} className="space-y-4">
          <input type="hidden" name="email" value={asked.email} />
          {next && <input type="hidden" name="next" value={next} />}
          <Field
            label="Code reçu"
            name="token"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            maxLength={10}
            placeholder="123456"
            className="text-center font-display text-2xl tracking-[0.3em]"
            error={checked.error}
          />
          <SubmitButton size="lg" block pendingLabel="Vérification…">
            Se connecter
          </SubmitButton>
        </form>
        <form action={ask} className="text-center">
          <input type="hidden" name="email" value={asked.email} />
          <SubmitButton variant="ghost" size="sm" pendingLabel="Envoi…">
            Renvoyer un code
          </SubmitButton>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-rise">
      <div>
        <h1 className="font-display text-[34px] font-bold leading-[1.05]">Content de te voir</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">Entre ton adresse e-mail : nous t&apos;envoyons un code. Pas de mot de passe à retenir.</p>
      </div>
      <form action={ask} className="space-y-4">
        <Field label="Adresse e-mail" name="email" type="email" inputMode="email" autoComplete="email" autoFocus required defaultValue={asked.email} placeholder="toi@exemple.fr" error={asked.error} />
        <SubmitButton size="lg" block pendingLabel="Envoi…">
          Recevoir mon code
        </SubmitButton>
      </form>
    </div>
  );
}
