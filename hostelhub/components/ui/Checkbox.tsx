"use client";

import { forwardRef } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckboxProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label?: React.ReactNode;
  description?: React.ReactNode;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, error, className, id, checked, ...props }, ref) => {
    const inputId =
      id ||
      (typeof label === "string"
        ? label.toLowerCase().replace(/\s/g, "-")
        : undefined);

    return (
      <div className={cn("relative flex items-start", className)}>
        <div className="flex h-6 items-center">
          <label htmlFor={inputId} className="relative cursor-pointer">
            <input
              ref={ref}
              id={inputId}
              type="checkbox"
              checked={checked}
              className="peer sr-only"
              {...props}
            />
            <div
              className={cn(
                "w-5 h-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center",
                "peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500/20 peer-focus-visible:ring-offset-2",
                "peer-disabled:opacity-50 peer-disabled:cursor-not-allowed",
                checked
                  ? "bg-primary-600 border-primary-600"
                  : error
                    ? "border-red-300 bg-white"
                    : "border-slate-300 bg-white hover:border-slate-400",
              )}
            >
              <Check
                className={cn(
                  "w-3.5 h-3.5 text-white transition-opacity",
                  checked ? "opacity-100" : "opacity-0",
                )}
                strokeWidth={3}
              />
            </div>
          </label>
        </div>

        {(label || description) && (
          <div className="ml-3">
            {label && (
              <label
                htmlFor={inputId}
                className={cn(
                  "text-sm font-medium cursor-pointer select-none",
                  error ? "text-red-600" : "text-slate-700",
                )}
              >
                {label}
              </label>
            )}
            {description && (
              <p className="text-sm text-slate-500">{description}</p>
            )}
            {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
          </div>
        )}
      </div>
    );
  },
);

Checkbox.displayName = "Checkbox";
