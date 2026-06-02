import Skeleton from "@/common/Skeleton";

// Public-specific layout placeholder (Landing page-ish)
export const PublicSkeleton = () => (
  <div className="w-full space-y-12 animate-pulse">
    <Skeleton className="h-[500px] w-full rounded-none" /> {/* Hero area */}
    <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
    <div className="max-w-7xl mx-auto px-4">
      <Skeleton className="h-[300px] w-full" />
    </div>
  </div>
);