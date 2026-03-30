"use client";

import { forwardRef, Fragment } from "react";
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
  Transition,
} from "@headlessui/react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  label?: string;
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  error?: string;
  hint?: string;
  disabled?: boolean;
  className?: string;
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      label,
      options,
      value,
      onChange,
      placeholder = "Select an option",
      error,
      hint,
      disabled = false,
      className,
    },
    ref,
  ) => {
    const selectedOption = options.find((opt) => opt.value === value);

    return (
      <div className={cn("w-full", className)}>
        {label && (
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {label}
          </label>
        )}
        <Listbox value={value} onChange={onChange} disabled={disabled}>
          <div className="relative">
            <ListboxButton
              ref={ref}
              className={cn(
                "relative w-full px-4 py-2.5 rounded-xl border bg-white text-left transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500",
                error
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                  : "border-slate-200 hover:border-slate-300",
                disabled && "opacity-50 cursor-not-allowed bg-slate-50",
              )}
            >
              <span
                className={cn(
                  "block truncate",
                  selectedOption ? "text-slate-800" : "text-slate-400",
                )}
              >
                {selectedOption?.label || placeholder}
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <ChevronDown
                  className="h-5 w-5 text-slate-400"
                  aria-hidden="true"
                />
              </span>
            </ListboxButton>

            <Transition
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <ListboxOptions className="absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-xl bg-white py-2 shadow-lg ring-1 ring-black/5 focus:outline-none">
                {options.map((option) => (
                  <ListboxOption
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    className={({ active, selected, disabled }) =>
                      cn(
                        "relative cursor-pointer select-none py-2.5 pl-10 pr-4 transition-colors",
                        active && "bg-primary-50",
                        selected && "bg-primary-50 text-primary-700",
                        disabled && "opacity-50 cursor-not-allowed",
                        !active && !selected && "text-slate-700",
                      )
                    }
                  >
                    {({ selected }) => (
                      <>
                        <span
                          className={cn(
                            "block truncate",
                            selected ? "font-semibold" : "font-normal",
                          )}
                        >
                          {option.label}
                        </span>
                        {selected && (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-600">
                            <Check className="h-5 w-5" aria-hidden="true" />
                          </span>
                        )}
                      </>
                    )}
                  </ListboxOption>
                ))}
              </ListboxOptions>
            </Transition>
          </div>
        </Listbox>
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

Select.displayName = "Select";
