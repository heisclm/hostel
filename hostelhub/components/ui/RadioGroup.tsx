"use client";

import { forwardRef, createContext, useContext } from "react";
import { cn } from "@/lib/utils";

interface RadioGroupContextValue {
  name: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

interface RadioGroupProps {
  name: string;
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  orientation?: "horizontal" | "vertical";
  className?: string;
}

export function RadioGroup({
  name,
  value,
  onChange,
  label,
  error,
  hint,
  children,
  orientation = "vertical",
  className,
}: RadioGroupProps) {
  return (
    <RadioGroupContext.Provider value={{ name, value, onChange, error }}>
      <div className={cn("w-full", className)} role="radiogroup">
        {label && (
          <label className="block text-sm font-medium text-slate-700 mb-3">
            {label}
          </label>
        )}
        <div
          className={cn(
            "flex gap-3",
            orientation === "vertical" ? "flex-col" : "flex-row flex-wrap",
          )}
        >
          {children}
        </div>
        {(error || hint) && (
          <p
            className={cn(
              "mt-2 text-sm",
              error ? "text-red-500" : "text-slate-500",
            )}
          >
            {error || hint}
          </p>
        )}
      </div>
    </RadioGroupContext.Provider>
  );
}

interface RadioOptionProps {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export const RadioOption = forwardRef<HTMLInputElement, RadioOptionProps>(
  ({ value, label, description, disabled = false, className }, ref) => {
    const context = useContext(RadioGroupContext);
    if (!context) {
      throw new Error("RadioOption must be used within a RadioGroup");
    }

    const { name, value: groupValue, onChange, error } = context;
    const isChecked = groupValue === value;
    const inputId = `${name}-${value}`;

    return (
      <div
        className={cn(
          "relative flex items-start",
          disabled && "opacity-50 cursor-not-allowed",
          className,
        )}
      >
        <div className="flex h-6 items-center">
          <input
            ref={ref}
            id={inputId}
            name={name}
            type="radio"
            value={value}
            checked={isChecked}
            onChange={() => onChange?.(value)}
            disabled={disabled}
            className="sr-only"
          />
          <div
            className={cn(
              "w-5 h-5 rounded-full border-2 transition-all duration-200 flex items-center justify-center",
              "focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:ring-offset-2",
              isChecked
                ? "border-primary-600 bg-primary-600"
                : error
                  ? "border-red-300"
                  : "border-slate-300 hover:border-slate-400",
              disabled && "cursor-not-allowed",
            )}
            onClick={() => !disabled && onChange?.(value)}
          >
            {isChecked && <div className="w-2 h-2 rounded-full bg-white" />}
          </div>
        </div>
        <div className="ml-3">
          <label
            htmlFor={inputId}
            className={cn(
              "text-sm font-medium cursor-pointer",
              error ? "text-red-600" : "text-slate-700",
              disabled && "cursor-not-allowed",
            )}
          >
            {label}
          </label>
          {description && (
            <p className="text-sm text-slate-500">{description}</p>
          )}
        </div>
      </div>
    );
  },
);

RadioOption.displayName = "RadioOption";
