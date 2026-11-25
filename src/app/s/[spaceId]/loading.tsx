import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-4 pt-4" aria-busy="true" aria-label="Chargement">
      <Skeleton className="h-10 w-3/4" />
      <Skeleton className="h-44 rounded-4xl" />
      <Skeleton className="h-24 rounded-3xl" />
      <Skeleton className="h-24 rounded-3xl" />
    </div>
  );
}
