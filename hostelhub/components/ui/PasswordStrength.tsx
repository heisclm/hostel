"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

export function PasswordStrength({
  password,
  className,
}: PasswordStrengthProps) {
  const strength = useMemo(() => {
    if (!password) return { score: 0, label: "", color: "" };

    let score = 0;

    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;

    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;

    if (score <= 2) {
      return { score: 1, label: "Weak", color: "bg-red-500" };
    } else if (score <= 4) {
      return { score: 2, label: "Fair", color: "bg-amber-500" };
    } else if (score <= 5) {
      return { score: 3, label: "Good", color: "bg-blue-500" };
    } else {
      return { score: 4, label: "Strong", color: "bg-green-500" };
    }
  }, [password]);

  if (!password) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors duration-300",
              strength.score >= level ? strength.color : "bg-slate-200",
            )}
          />
        ))}
      </div>

      <p className="text-xs text-slate-500">
        Password strength:{" "}
        <span
          className={cn(
            "font-medium",
            strength.score === 1 && "text-red-600",
            strength.score === 2 && "text-amber-600",
            strength.score === 3 && "text-blue-600",
            strength.score === 4 && "text-green-600",
          )}
        >
          {strength.label}
        </span>
      </p>
    </div>
  );
}
