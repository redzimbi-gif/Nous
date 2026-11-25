"use client";

import { useState } from "react";
import { Button } from "./Button";
import { Icon } from "./Icon";

export function CopyButton({ value, label = "Copier" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="soft"
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          // Presse-papiers indisponible : on ne fait rien de plus.
        }
      }}
    >
      <Icon name={copied ? "check" : "copy"} size={16} strokeWidth={2.2} />
      <span aria-live="polite">{copied ? "Copié" : label}</span>
    </Button>
  );
}
