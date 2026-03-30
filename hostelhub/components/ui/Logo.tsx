import { cn } from "@/lib/utils";
import { Home } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "white";
  showText?: boolean;
  className?: string;
}

const sizes = {
  sm: { icon: "w-6 h-6", text: "text-lg" },
  md: { icon: "w-8 h-8", text: "text-xl" },
  lg: { icon: "w-10 h-10", text: "text-2xl" },
};

export function Logo({
  size = "md",
  variant = "default",
  showText = true,
  className,
}: LogoProps) {
  const sizeStyles = sizes[size];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "rounded-xl flex items-center justify-center",
          sizeStyles.icon,
          variant === "default"
            ? "bg-linear-to-br from-primary-500 to-primary-700"
            : "bg-white/20",
        )}
      >
        <Home className="w-1/2 h-1/2 text-white" />
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <span
            className={cn(
              "font-bold tracking-tight",
              sizeStyles.text,
              variant === "default" ? "text-slate-800" : "text-white",
            )}
          >
            HostelHub
          </span>
        
        </div>
      )}
    </div>
  );
}
