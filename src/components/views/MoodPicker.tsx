import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { MOODS, moodEmoji, moodLabel } from "@/lib/moods";
import type { MemberView } from "./AccueilView";

interface Props {
  members: MemberView[];
  currentMood: string | null;
  /** Fabrique l'action serveur d'une humeur ; absente dans l'aperçu statique. */
  makeAction?: (mood: string | null) => () => void | Promise<void>;
}

export function MoodPicker({ members, currentMood, makeAction }: Props) {
  return (
    <div className="space-y-6">
      <section aria-labelledby="mood-title">
        <h2 id="mood-title" className="px-1 pb-3 font-display text-lg font-semibold">
          Mon humeur
        </h2>
        <ul className="grid grid-cols-4 gap-2.5">
          {MOODS.map((m) => {
            const selected = currentMood === m.value;
            const body = (
              <>
                <span className="text-[28px] leading-none" aria-hidden="true">
                  {m.emoji}
                </span>
                <span className="mt-1.5 text-[11px] font-semibold leading-tight">{m.label}</span>
              </>
            );
            const cls = cn(
              "flex h-[84px] w-full flex-col items-center justify-center rounded-3xl p-1 text-center transition active:scale-95",
              selected ? "bg-tint text-tint-ink ring-2 ring-primary" : "bg-surface text-ink shadow-card ring-1 ring-line",
            );
            return (
              <li key={m.value}>
                {makeAction ? (
                  <form action={makeAction(selected ? null : m.value)}>
                    <button type="submit" aria-pressed={selected} className={cls}>
                      {body}
                    </button>
                  </form>
                ) : (
                  <button type="button" aria-pressed={selected} className={cls}>
                    {body}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
        <p className="px-1 pt-3 text-sm text-muted">Touche l&apos;humeur sélectionnée pour la retirer.</p>
      </section>

      <section aria-labelledby="others-title">
        <h2 id="others-title" className="px-1 pb-3 font-display text-lg font-semibold">
          Dans l&apos;espace
        </h2>
        <Card className="divide-y divide-line overflow-hidden">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 px-4 py-3">
              <Avatar name={m.name} tone={m.tone} size="sm" />
              <span className="min-w-0 flex-1 truncate text-[17px] font-semibold">{m.name}</span>
              <span className="text-[15px] text-muted">
                {moodEmoji(m.mood) ? (
                  <>
                    <span aria-hidden="true">{moodEmoji(m.mood)}</span> {moodLabel(m.mood)}
                  </>
                ) : (
                  "Pas d'humeur"
                )}
              </span>
            </div>
          ))}
        </Card>
      </section>
    </div>
  );
}
