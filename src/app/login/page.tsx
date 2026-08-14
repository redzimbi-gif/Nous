"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
      router.push("/chat");
      router.refresh();
    } else {
      setError(true);
      setCode("");
    }
  }

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-blush-50 px-6">
      <div className="w-full max-w-sm text-center">
        <div className="mb-6 text-5xl">💌</div>
        <h1 className="mb-1 text-2xl font-extrabold text-blush-700">Nous</h1>
        <p className="mb-8 text-sm text-blush-500">
          Notre petit espace, rien qu&apos;à nous
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Code secret"
            className={`w-full rounded-2xl border-2 bg-white px-5 py-4 text-center text-lg outline-none transition ${
              error
                ? "animate-shake border-red-400"
                : "border-blush-200 focus:border-blush-400"
            }`}
          />
          {error && (
            <p className="text-sm text-red-500">Code incorrect, réessaie 💭</p>
          )}
          <button
            type="submit"
            disabled={loading || !code}
            className="w-full rounded-2xl bg-blush-500 py-4 text-lg font-bold text-white shadow-lg shadow-blush-200 transition hover:bg-blush-600 disabled:opacity-50"
          >
            {loading ? "…" : "Entrer"}
          </button>
        </form>
      </div>
    </main>
  );
}
