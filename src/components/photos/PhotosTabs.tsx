import Link from "next/link";
import { cn } from "@/lib/cn";

/** Photos | Albums : deux pages, un même bandeau. */
export default function PhotosTabs({ active }: { active: "photos" | "albums" }) {
  const item = (isActive: boolean) => cn("flex-1 rounded-full py-2 text-center font-display text-[15px] font-semibold transition", isActive ? "bg-surface text-ink shadow-card" : "text-muted");
  return (
    <nav aria-label="Photos et albums" className="flex flex-1 rounded-full bg-tint/70 p-1">
      <Link href="/photos" aria-current={active === "photos" ? "page" : undefined} className={item(active === "photos")}>
        Photos
      </Link>
      <Link href="/photos/albums" aria-current={active === "albums" ? "page" : undefined} className={item(active === "albums")}>
        Albums
      </Link>
    </nav>
  );
}
