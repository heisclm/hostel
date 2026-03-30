"use client";

import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

type AlertVariant = "success" | "error" | "warning" | "info";

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

const variants: Record<
  AlertVariant,
  { container: string; icon: string; iconComponent: React.ElementType }
> = {
  success: {
    container: "bg-green-50 border-green-200 text-green-800",
    icon: "text-green-500",
    iconComponent: CheckCircle,
  },
  error: {
    container: "bg-red-50 border-red-200 text-red-800",
    icon: "text-red-500",
    iconComponent: XCircle,
  },
  warning: {
    container: "bg-amber-50 border-amber-200 text-amber-800",
    icon: "text-amber-500",
    iconComponent: AlertTriangle,
  },
  info: {
    container: "bg-blue-50 border-blue-200 text-blue-800",
    icon: "text-blue-500",
    iconComponent: Info,
  },
};

export function Alert({
  variant = "info",
  title,
  children,
  onClose,
  className,
}: AlertProps) {
  const variantStyles = variants[variant];
  const IconComponent = variantStyles.iconComponent;

  return (
    <div
      className={cn(
        "relative flex gap-3 p-4 rounded-xl border",
        variantStyles.container,
        className,
      )}
      role="alert"
    >
      <IconComponent className={cn("w-5 h-5 shrink-0", variantStyles.icon)} />
      <div className="flex-1">
        {title && <h4 className="font-semibold mb-1">{title}</h4>}
        <div className="text-sm">{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-black/5 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
