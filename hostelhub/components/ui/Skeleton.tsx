import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular" | "rounded";
  width?: string | number;
  height?: string | number;
  animate?: boolean;
}

export function Skeleton({
  className,
  variant = "text",
  width,
  height,
  animate = true,
}: SkeletonProps) {
  const baseStyles = cn(
    "bg-slate-200",
    animate && "animate-pulse",
    variant === "text" && "h-4 rounded",
    variant === "circular" && "rounded-full",
    variant === "rectangular" && "rounded-none",
    variant === "rounded" && "rounded-xl",
  );

  const style: React.CSSProperties = {
    width: width,
    height: height,
  };

  return <div className={cn(baseStyles, className)} style={style} />;
}
export function HostelCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-slate-200">
      <Skeleton variant="rectangular" className="h-48 w-full" />
      <div className="p-5 space-y-4">
        <div className="space-y-2">
          <Skeleton variant="text" className="h-5 w-3/4" />
          <Skeleton variant="text" className="h-4 w-1/2" />
        </div>
        <div className="flex gap-2">
          <Skeleton variant="rounded" className="h-8 w-8" />
          <Skeleton variant="rounded" className="h-8 w-8" />
          <Skeleton variant="rounded" className="h-8 w-8" />
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="space-y-1">
            <Skeleton variant="text" className="h-3 w-12" />
            <Skeleton variant="text" className="h-6 w-20" />
          </div>
          <Skeleton variant="rounded" className="h-9 w-16" />
        </div>
      </div>
    </div>
  );
}

export function TestimonialSkeleton() {
  return (
    <div className="bg-white rounded-3xl p-8 space-y-6">
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} variant="circular" className="w-5 h-5" />
        ))}
      </div>
      <div className="space-y-2">
        <Skeleton variant="text" className="h-4 w-full" />
        <Skeleton variant="text" className="h-4 w-full" />
        <Skeleton variant="text" className="h-4 w-3/4" />
      </div>
      <div className="flex items-center gap-4">
        <Skeleton variant="circular" className="w-12 h-12" />
        <div className="space-y-2">
          <Skeleton variant="text" className="h-4 w-32" />
          <Skeleton variant="text" className="h-3 w-24" />
        </div>
      </div>
    </div>
  );
}

export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr>
      {[...Array(columns)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton variant="text" className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}
