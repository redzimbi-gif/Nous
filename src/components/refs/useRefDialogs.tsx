"use client";

import { useState } from "react";
import RefDetail from "@/components/RefDetail";
import RefModal from "@/components/RefModal";
import type { RefCategory, RefRow } from "@/lib/types";
import type { RefFormValues } from "@/lib/useRefs";

/** Fiche d'une réf et formulaire d'ajout / de modification, partagés par les pages de l'armoire. */
export function useRefDialogs(api: { urls: Record<string, string>; saving: boolean; save: (editing: RefRow | null, values: RefFormValues) => Promise<string | null>; remove: (ref: RefRow) => Promise<void> }) {
  const [selected, setSelected] = useState<RefRow | null>(null);
  const [modal, setModal] = useState<{ editing: RefRow | null; defaultCategory?: RefCategory } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(values: RefFormValues) {
    const message = await api.save(modal?.editing ?? null, values);
    if (message) {
      setError(message);
      return;
    }
    setModal(null);
    setSelected(null);
  }

  async function handleDelete() {
    if (!selected) return;
    await api.remove(selected);
    setSelected(null);
  }

  const dialogs = (
    <>
      {modal && (
        <RefModal
          initial={modal.editing ?? undefined}
          defaultCategory={modal.defaultCategory}
          existingMediaUrl={modal.editing?.media_path ? api.urls[modal.editing.media_path] : undefined}
          onClose={() => setModal(null)}
          onSave={handleSave}
          saving={api.saving}
          error={error}
        />
      )}
      {selected && !modal && (
        <RefDetail
          item={selected}
          url={selected.media_path ? api.urls[selected.media_path] : undefined}
          onClose={() => setSelected(null)}
          onEdit={() => {
            setError(null);
            setModal({ editing: selected });
          }}
          onDelete={handleDelete}
        />
      )}
    </>
  );

  return {
    open: setSelected,
    openNew: (defaultCategory?: RefCategory) => {
      setError(null);
      setModal({ editing: null, defaultCategory });
    },
    dialogs,
  };
}
