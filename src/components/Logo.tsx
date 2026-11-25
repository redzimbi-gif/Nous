import { cn } from "@/lib/cn";

/** Deux cercles qui se recouvrent : « nous ». */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={(size * 104) / 168} viewBox="0 0 168 104" className={className} aria-hidden="true">
      <defs>
        <clipPath id="logo-left">
          <circle cx="62" cy="52" r="44" />
        </clipPath>
      </defs>
      <circle cx="62" cy="52" r="44" fill="#ffaebb" />
      <circle cx="106" cy="52" r="44" fill="#dcbdef" />
      <circle cx="106" cy="52" r="44" fill="#8f52ba" clipPath="url(#logo-left)" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={34} />
      <span className="font-display text-[26px] font-bold tracking-tight">Nous</span>
    </span>
  );
}
