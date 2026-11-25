"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export default function LoginPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(false);
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/accueil");
      router.refresh();
    } else {
      setError(true);
      setCode("");
    }
  }

  return (
    <main className="page-glow flex min-h-[100dvh] flex-col items-center justify-center bg-bg px-6 text-ink">
      <div className="w-full max-w-sm animate-rise text-center">
        <Logo className="mb-3 justify-center" />
        <p className="mb-9 text-[15px] text-muted">Notre petit espace, rien qu&apos;à nous.</p>
        <form onSubmit={handleSubmit} className="space-y-4 rounded-4xl bg-surface p-6 text-left shadow-float ring-1 ring-line">
          <label htmlFor="code" className="block text-sm font-semibold text-muted">
            Code secret
          </label>
          <input
            type="password"
            name="code"
            id="code"
            autoFocus
            autoComplete="current-password"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            aria-invalid={error}
            aria-describedby={error ? "code-error" : undefined}
            className={cn(
              "h-14 w-full rounded-2xl bg-surface-2 px-5 text-center text-lg outline-none ring-1 transition focus:ring-2",
              error ? "animate-shake ring-danger focus:ring-danger" : "ring-line focus:ring-primary",
            )}
          />
          {error && (
            <p id="code-error" role="alert" className="text-sm font-semibold text-danger">
              Ce n&apos;est pas le bon code. Réessayez.
            </p>
          )}
          <Button type="submit" size="lg" block disabled={loading || !code}>
            {loading ? "Un instant…" : "Entrer"}
          </Button>
        </form>
      </div>
    </main>
  );
}
