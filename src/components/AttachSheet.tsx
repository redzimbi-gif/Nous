"use client";

import { Icon, type IconName } from "@/components/ui/Icon";
import { Sheet } from "@/components/ui/Sheet";

function Option({ icon, title, hint, onClick }: { icon: IconName; title: string; hint: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex flex-col items-start gap-3 rounded-3xl bg-surface-2 p-4 text-left ring-1 ring-line transition active:scale-[0.97]">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-tint text-tint-ink">
        <Icon name={icon} size={24} />
      </span>
      <span>
        <span className="block font-display text-[17px] font-semibold leading-tight">{title}</span>
        <span className="mt-0.5 block text-[13px] text-muted">{hint}</span>
      </span>
    </button>
  );
}

/** Le menu « + » du chat : d'où vient ce qu'on veut envoyer. */
export default function AttachSheet({
  open,
  onClose,
  onCamera,
  onPhone,
  onGallery,
  onRef,
}: {
  open: boolean;
  onClose: () => void;
  onCamera: () => void;
  onPhone: () => void;
  onGallery: () => void;
  onRef: () => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Ajouter">
      <div className="grid grid-cols-2 gap-3 px-2 pb-2">
        <Option icon="camera" title="Appareil photo" hint="Photo, vidéo ou éphémère" onClick={onCamera} />
        <Option icon="upload" title="Photo du téléphone" hint="Depuis ta galerie" onClick={onPhone} />
        <Option icon="gallery" title="Photos de Nous" hint="L'album que vous partagez" onClick={onGallery} />
        <Option icon="bookmark" title="Une réf" hint="Depuis l'armoire" onClick={onRef} />
      </div>
    </Sheet>
  );
}
