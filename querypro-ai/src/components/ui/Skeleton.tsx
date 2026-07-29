import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

/** A single shimmering placeholder block. Compose these to build page/section skeletons. */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-surface-container-high",
        className
      )}
      aria-hidden="true"
    />
  );
}

/** Skeleton for a page built from a header + a grid of cards (Dashboard, Templates, Saved). */
export function PageSkeleton() {
  return (
    <div className="px-lg md:px-2xl py-lg flex flex-col gap-lg" role="status" aria-label="Loading page">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-lg">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded" />
        ))}
      </div>
      <Skeleton className="h-80 rounded" />
    </div>
  );
}

/** Skeleton for full-bleed workspace-style pages (Workspace, AI Generator, Builder). */
export function WorkspaceSkeleton() {
  return (
    <div className="flex-1 flex flex-col p-lg gap-md" role="status" aria-label="Loading workspace">
      <div className="flex items-center gap-md">
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-6 w-48" />
      </div>
      <div className="flex-1 flex gap-lg min-h-0">
        <Skeleton className="w-64 shrink-0 rounded-lg hidden md:block" />
        <Skeleton className="flex-1 rounded-lg" />
      </div>
    </div>
  );
}
