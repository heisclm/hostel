"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface PhoneInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "onChange"
> {
  label?: string;
  error?: string;
  hint?: string;
  onChange?: (value: string) => void;
}

const networkPrefixes: Record<string, string> = {
  "024": "MTN",
  "054": "MTN",
  "055": "MTN",
  "059": "MTN",
  "020": "Vodafone",
  "050": "Vodafone",
  "023": "AirtelTigo",
  "026": "AirtelTigo",
  "027": "AirtelTigo",
  "057": "AirtelTigo",
};

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    { label, error, hint, onChange, className, id, value = "", ...props },
    ref,
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, "-");

    const formatPhoneNumber = (input: string): string => {
      const digits = input.replace(/\D/g, "");

      const limited = digits.slice(0, 10);

      if (limited.length <= 3) {
        return limited;
      } else if (limited.length <= 6) {
        return `${limited.slice(0, 3)} ${limited.slice(3)}`;
      } else {
        return `${limited.slice(0, 3)} ${limited.slice(3, 6)} ${limited.slice(6)}`;
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatPhoneNumber(e.target.value);
      onChange?.(formatted);
    };

    const getNetwork = (): string | null => {
      const digits = String(value).replace(/\D/g, "");
      if (digits.length >= 3) {
        const prefix = digits.slice(0, 3);
        return networkPrefixes[prefix] || null;
      }
      return null;
    };

    const network = getNetwork();

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-slate-500 border-r border-slate-200 pr-3">
            <span className="text-lg">🇬🇭</span>
            <span className="text-sm font-medium">+233</span>
          </div>

          <input
            ref={ref}
            id={inputId}
            type="tel"
            inputMode="numeric"
            value={value}
            onChange={handleChange}
            placeholder="024 XXX XXXX"
            className={cn(
              "w-full pl-24 pr-20 py-2.5 rounded-xl border bg-white transition-all duration-200",
              "text-slate-800 placeholder:text-slate-400",
              "focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500",
              error
                ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                : "border-slate-200 hover:border-slate-300",
              className,
            )}
            {...props}
          />

          {network && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <span
                className={cn(
                  "text-xs font-medium px-2 py-1 rounded-md",
                  network === "MTN" && "bg-yellow-100 text-yellow-700",
                  network === "Vodafone" && "bg-red-100 text-red-700",
                  network === "AirtelTigo" && "bg-blue-100 text-blue-700",
                )}
              >
                {network}
              </span>
            </div>
          )}
        </div>
        {(error || hint) && (
          <p
            className={cn(
              "mt-1.5 text-sm",
              error ? "text-red-500" : "text-slate-500",
            )}
          >
            {error || hint}
          </p>
        )}
      </div>
    );
  },
);

PhoneInput.displayName = "PhoneInput";
