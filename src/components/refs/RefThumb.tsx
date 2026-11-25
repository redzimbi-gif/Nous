import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import { categoryInfo, refCategory } from "@/lib/refs";
import type { RefRow } from "@/lib/types";

/** Vignette d'une réf : son image, l'image de son lien, ou l'icône de sa catégorie. */
export default function RefThumb({ item, mediaUrl, className }: { item: RefRow; mediaUrl?: string; className?: string }) {
  const image = item.media_type === "image" && mediaUrl ? mediaUrl : item.preview?.image ?? null;
  const category = categoryInfo(refCategory(item));
  return (
    <span className={cn("flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-tint text-tint-ink", className)} aria-hidden="true">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" referrerPolicy="no-referrer" loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <Icon name={item.media_type === "video" ? "video" : category.icon} size={24} />
      )}
    </span>
  );
}
