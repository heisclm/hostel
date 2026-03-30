/* eslint-disable @typescript-eslint/no-unused-vars */

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface RangeSliderProps {
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  formatValue?: (value: number) => string;
  label?: string;
  className?: string;
}

export function RangeSlider({
  min,
  max,
  step = 1,
  value,
  onChange,
  formatValue = (v) => v.toString(),
  label,
  className,
}: RangeSliderProps) {
  const [localValue, setLocalValue] = useState(value);
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef<"min" | "max" | null>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const getPercentage = useCallback(
    (val: number) => ((val - min) / (max - min)) * 100,
    [min, max],
  );

  const getValueFromPosition = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return min;

      const rect = trackRef.current.getBoundingClientRect();
      const percentage = Math.max(
        0,
        Math.min(1, (clientX - rect.left) / rect.width),
      );
      const rawValue = min + percentage * (max - min);
      const steppedValue = Math.round(rawValue / step) * step;
      return Math.max(min, Math.min(max, steppedValue));
    },
    [min, max, step],
  );

  const handleMouseDown = (thumb: "min" | "max") => (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = thumb;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging.current) return;

      const newValue = getValueFromPosition(e.clientX);

      setLocalValue((prev) => {
        if (isDragging.current === "min") {
          const newMin = Math.min(newValue, prev[1] - step);
          return [newMin, prev[1]];
        } else {
          const newMax = Math.max(newValue, prev[0] + step);
          return [prev[0], newMax];
        }
      });
    },
    [getValueFromPosition, step],
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging.current) {
      onChange(localValue);
    }
    isDragging.current = null;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  }, [localValue, onChange, handleMouseMove]);

  const handleTouchStart = (thumb: "min" | "max") => (e: React.TouchEvent) => {
    isDragging.current = thumb;
  };

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging.current) return;

      const touch = e.touches[0];
      const newValue = getValueFromPosition(touch.clientX);

      setLocalValue((prev) => {
        if (isDragging.current === "min") {
          const newMin = Math.min(newValue, prev[1] - step);
          return [newMin, prev[1]];
        } else {
          const newMax = Math.max(newValue, prev[0] + step);
          return [prev[0], newMax];
        }
      });
    },
    [getValueFromPosition, step],
  );

  const handleTouchEnd = useCallback(() => {
    if (isDragging.current) {
      onChange(localValue);
    }
    isDragging.current = null;
  }, [localValue, onChange]);

  const leftPercent = getPercentage(localValue[0]);
  const rightPercent = getPercentage(localValue[1]);

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-3">
          {label}
        </label>
      )}

      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-slate-800 bg-slate-100 px-3 py-1 rounded-lg">
          {formatValue(localValue[0])}
        </span>
        <span className="text-slate-400">—</span>
        <span className="text-sm font-medium text-slate-800 bg-slate-100 px-3 py-1 rounded-lg">
          {formatValue(localValue[1])}
        </span>
      </div>

      <div
        ref={trackRef}
        className="relative h-2 bg-slate-200 rounded-full cursor-pointer"
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="absolute h-full bg-primary-500 rounded-full"
          style={{
            left: `${leftPercent}%`,
            width: `${rightPercent - leftPercent}%`,
          }}
        />

        <div
          className={cn(
            "absolute w-5 h-5 bg-white rounded-full shadow-md border-2 border-primary-500 -translate-x-1/2 -translate-y-1/2 top-1/2 cursor-grab",
            "hover:scale-110 active:cursor-grabbing active:scale-110 transition-transform",
            "focus:outline-none focus:ring-2 focus:ring-primary-500/50",
          )}
          style={{ left: `${leftPercent}%` }}
          onMouseDown={handleMouseDown("min")}
          onTouchStart={handleTouchStart("min")}
          tabIndex={0}
          role="slider"
          aria-valuemin={min}
          aria-valuemax={localValue[1]}
          aria-valuenow={localValue[0]}
        />

        <div
          className={cn(
            "absolute w-5 h-5 bg-white rounded-full shadow-md border-2 border-primary-500 -translate-x-1/2 -translate-y-1/2 top-1/2 cursor-grab",
            "hover:scale-110 active:cursor-grabbing active:scale-110 transition-transform",
            "focus:outline-none focus:ring-2 focus:ring-primary-500/50",
          )}
          style={{ left: `${rightPercent}%` }}
          onMouseDown={handleMouseDown("max")}
          onTouchStart={handleTouchStart("max")}
          tabIndex={0}
          role="slider"
          aria-valuemin={localValue[0]}
          aria-valuemax={max}
          aria-valuenow={localValue[1]}
        />
      </div>

      <div className="flex justify-between mt-2">
        <span className="text-xs text-slate-400">{formatValue(min)}</span>
        <span className="text-xs text-slate-400">{formatValue(max)}</span>
      </div>
    </div>
  );
}
