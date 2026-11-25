import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { previewEnabled } from "@/lib/preview";

export function ConfigNotice() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md items-center px-5">
      <Card className="space-y-3 p-6">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-warm text-warm-ink">
          <Icon name="lock" />
        </span>
        <h1 className="font-display text-2xl font-bold">Configuration manquante</h1>
        <p className="text-[15px] leading-relaxed text-muted">
          Renseigne <code className="rounded bg-surface-2 px-1">NEXT_PUBLIC_SUPABASE_URL</code> et{" "}
          <code className="rounded bg-surface-2 px-1">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> (voir <code className="rounded bg-surface-2 px-1">.env.example</code>), puis relance l&apos;application.
        </p>
        {previewEnabled() && (
          <div className="pt-2">
            <ButtonLink href="/preview" block>
              Voir l&apos;aperçu de l&apos;interface
            </ButtonLink>
          </div>
        )}
      </Card>
    </main>
  );
}
