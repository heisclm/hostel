import { cn, generateInitials } from "@/lib/utils";
import Image from "next/image";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: AvatarSize;
  className?: string;
  status?: "online" | "offline" | "away";
}

const sizes: Record<
  AvatarSize,
  { container: string; text: string; status: string }
> = {
  xs: { container: "w-6 h-6", text: "text-xs", status: "w-1.5 h-1.5" },
  sm: { container: "w-8 h-8", text: "text-xs", status: "w-2 h-2" },
  md: { container: "w-10 h-10", text: "text-sm", status: "w-2.5 h-2.5" },
  lg: { container: "w-12 h-12", text: "text-base", status: "w-3 h-3" },
  xl: { container: "w-16 h-16", text: "text-lg", status: "w-4 h-4" },
};

const statusColors = {
  online: "bg-green-500",
  offline: "bg-slate-400",
  away: "bg-amber-500",
};

export function Avatar({
  src,
  name,
  size = "md",
  className,
  status,
}: AvatarProps) {
  const initials = generateInitials(name);
  const sizeStyles = sizes[size];

  return (
    <div className={cn("relative inline-block", className)}>
      <div
        className={cn(
          "rounded-full bg-linear-to-br from-primary-400 to-primary-600 flex items-center justify-center overflow-hidden",
          sizeStyles.container,
        )}
      >
        {src ? (
          <Image src={src} alt={name} fill className="object-cover" />
        ) : (
          <span className={cn("font-semibold text-white", sizeStyles.text)}>
            {initials}
          </span>
        )}
      </div>
      {status && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full ring-2 ring-white",
            sizeStyles.status,
            statusColors[status],
          )}
        />
      )}
    </div>
  );
}
