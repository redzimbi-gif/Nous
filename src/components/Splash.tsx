"use client";

import { useEffect, useState } from "react";

/**
 * Écran de lancement : s'affiche une fois à l'ouverture de l'application, puis s'efface.
 * Un script dans <head> le masque avant le premier affichage quand il a déjà été vu
 * pendant la session (rechargement, retour dans l'appli), pour éviter tout clignotement.
 */
export default function Splash() {
  const [phase, setPhase] = useState<"in" | "out" | "done">("in");

  useEffect(() => {
    // Le script du <head> a déjà marqué la page « à ignorer » si le splash a été vu pendant cette session.
    if (document.documentElement.dataset.splash === "skip") {
      setPhase("done");
      return;
    }
    try {
      sessionStorage.setItem("nous-splash", "1");
    } catch {
      // stockage indisponible : le splash se joue à chaque ouverture, sans conséquence
    }
    const hide = setTimeout(() => setPhase("out"), 1500);
    const remove = setTimeout(() => setPhase("done"), 2000);
    return () => {
      clearTimeout(hide);
      clearTimeout(remove);
    };
  }, []);

  if (phase === "done") return null;

  return (
    <div
      data-splash-screen
      aria-hidden="true"
      onClick={() => setPhase("out")}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center gap-7 bg-primary text-primary-on transition-opacity duration-500 ${
        phase === "out" ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <svg width="168" height="104" viewBox="0 0 168 104" className="animate-rise" aria-hidden="true">
        <defs>
          <clipPath id="splash-left">
            <circle cx="62" cy="52" r="44" />
          </clipPath>
        </defs>
        <circle cx="62" cy="52" r="44" fill="#ffaebb" />
        <circle cx="106" cy="52" r="44" fill="#dcbdef" />
        <circle cx="106" cy="52" r="44" fill="#ffffff" clipPath="url(#splash-left)" />
      </svg>
      <div className="flex animate-rise flex-col items-center gap-2.5 [animation-delay:120ms]">
        <span className="font-display text-[72px] font-bold leading-none tracking-tight">Nous</span>
        <span className="text-lg font-medium">Rien qu&apos;entre vous.</span>
      </div>
    </div>
  );
}
