"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  X,
  Wifi,
  Car,
  Zap,
  Droplets,
  Shield,
  ChevronDown,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select, SelectOption } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { RangeSlider } from "@/components/ui/RangeSlider";
import { Badge } from "@/components/ui/Badge";
import { cn, formatCurrency } from "@/lib/utils";
import type { HostelFilters as Filters, RoomType } from "@/types";

const sortOptions: SelectOption[] = [
  { value: "rating", label: "Highest Rated" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "distance", label: "Nearest to Campus" },
];

const roomTypeOptions: SelectOption[] = [
  { value: "", label: "All Room Types" },
  { value: "single", label: "Single Room" },
  { value: "double", label: "Double Room" },
  { value: "triple", label: "Triple Room" },
  { value: "quad", label: "Quad Room" },
  { value: "dormitory", label: "Dormitory" },
];

const facilityOptions = [
  { id: "wifi", label: "WiFi", icon: Wifi },
  { id: "parking", label: "Parking", icon: Car },
  { id: "electricity", label: "24/7 Power", icon: Zap },
  { id: "water", label: "Water Supply", icon: Droplets },
  { id: "security", label: "Security", icon: Shield },
];

const distanceOptions = [
  { value: 0.5, label: "Within 500m" },
  { value: 1, label: "Within 1km" },
  { value: 2, label: "Within 2km" },
  { value: 5, label: "Within 5km" },
];

interface HostelFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  onSearch: () => void;
  totalResults?: number;
  isLoading?: boolean;
}

interface FilterContentProps {
  filters: Filters;
  expandedSections: string[];
  onToggleSection: (section: string) => void;
  onUpdateFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  onResetFilters: () => void;
  activeFiltersCount: number;
}

function FilterContent({
  filters,
  expandedSections,
  onToggleSection,
  onUpdateFilter,
  onResetFilters,
  activeFiltersCount,
}: FilterContentProps) {
  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => onToggleSection("price")}
          className="flex items-center justify-between w-full text-left"
        >
          <span className="font-medium text-slate-800">Price Range</span>
          <ChevronDown
            className={cn(
              "w-5 h-5 text-slate-400 transition-transform",
              expandedSections.includes("price") && "rotate-180",
            )}
          />
        </button>
        <AnimatePresence>
          {expandedSections.includes("price") && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-4">
                <RangeSlider
                  min={0}
                  max={2000}
                  step={50}
                  value={[filters.minPrice || 0, filters.maxPrice || 2000]}
                  onChange={([min, max]) => {
                    onUpdateFilter("minPrice", min === 0 ? undefined : min);
                    onUpdateFilter("maxPrice", max === 2000 ? undefined : max);
                  }}
                  formatValue={(v) => formatCurrency(v)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="border-t border-slate-100 pt-6">
        <button
          onClick={() => onToggleSection("distance")}
          className="flex items-center justify-between w-full text-left"
        >
          <span className="font-medium text-slate-800">Distance to Campus</span>
          <ChevronDown
            className={cn(
              "w-5 h-5 text-slate-400 transition-transform",
              expandedSections.includes("distance") && "rotate-180",
            )}
          />
        </button>
        <AnimatePresence>
          {expandedSections.includes("distance") && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-4 space-y-2">
                {distanceOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <input
                      type="radio"
                      name="distance"
                      checked={filters.maxDistance === option.value}
                      onChange={() =>
                        onUpdateFilter("maxDistance", option.value)
                      }
                      className="sr-only"
                    />
                    <div
                      className={cn(
                        "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors",
                        filters.maxDistance === option.value
                          ? "border-primary-500 bg-primary-500"
                          : "border-slate-300 group-hover:border-slate-400",
                      )}
                    >
                      {filters.maxDistance === option.value && (
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      )}
                    </div>
                    <span className="text-sm text-slate-600">
                      {option.label}
                    </span>
                  </label>
                ))}
                {filters.maxDistance && (
                  <button
                    onClick={() => onUpdateFilter("maxDistance", undefined)}
                    className="text-sm text-primary-600 hover:underline mt-2"
                  >
                    Clear distance filter
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="border-t border-slate-100 pt-6">
        <button
          onClick={() => onToggleSection("roomType")}
          className="flex items-center justify-between w-full text-left"
        >
          <span className="font-medium text-slate-800">Room Type</span>
          <ChevronDown
            className={cn(
              "w-5 h-5 text-slate-400 transition-transform",
              expandedSections.includes("roomType") && "rotate-180",
            )}
          />
        </button>
        <AnimatePresence>
          {expandedSections.includes("roomType") && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-4">
                <Select
                  options={roomTypeOptions}
                  value={filters.roomType || ""}
                  onChange={(value) =>
                    onUpdateFilter(
                      "roomType",
                      (value || undefined) as RoomType | undefined,
                    )
                  }
                  placeholder="Select room type"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="border-t border-slate-100 pt-6">
        <button
          onClick={() => onToggleSection("facilities")}
          className="flex items-center justify-between w-full text-left"
        >
          <span className="font-medium text-slate-800">Facilities</span>
          <ChevronDown
            className={cn(
              "w-5 h-5 text-slate-400 transition-transform",
              expandedSections.includes("facilities") && "rotate-180",
            )}
          />
        </button>
        <AnimatePresence>
          {expandedSections.includes("facilities") && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-4 space-y-3">
                {facilityOptions.map((facility) => {
                  const isSelected = filters.facilities?.includes(facility.id);
                  return (
                    <label
                      key={facility.id}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <Checkbox
                        checked={isSelected}
                        onChange={() => {
                          const newFacilities = isSelected
                            ? filters.facilities?.filter(
                                (f) => f !== facility.id,
                              )
                            : [...(filters.facilities || []), facility.id];
                          onUpdateFilter("facilities", newFacilities);
                        }}
                      />
                      <facility.icon className="w-4 h-4 text-slate-500" />
                      <span className="text-sm text-slate-600">
                        {facility.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {activeFiltersCount > 0 && (
        <div className="border-t border-slate-100 pt-6">
          <Button
            variant="ghost"
            fullWidth
            onClick={onResetFilters}
            leftIcon={<RotateCcw className="w-4 h-4" />}
          >
            Reset All Filters
          </Button>
        </div>
      )}
    </div>
  );
}

export function HostelFilters({
  filters,
  onFiltersChange,
  onSearch,
  totalResults,
  isLoading = false,
}: HostelFiltersProps) {
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>([
    "price",
    "distance",
    "facilities",
  ]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section],
    );
  };

  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const resetFilters = () => {
    onFiltersChange({
      search: "",
      minPrice: undefined,
      maxPrice: undefined,
      maxDistance: undefined,
      facilities: [],
      roomType: undefined,
      sortBy: "rating",
    });
  };

  const activeFiltersCount = [
    filters.minPrice || filters.maxPrice,
    filters.maxDistance,
    filters.facilities && filters.facilities.length > 0,
    filters.roomType,
  ].filter(Boolean).length;

  const filterContentProps: FilterContentProps = {
    filters,
    expandedSections,
    onToggleSection: toggleSection,
    onUpdateFilter: updateFilter,
    onResetFilters: resetFilters,
    activeFiltersCount,
  };

  return (
    <>
      <aside className="hidden lg:block w-72 shrink-0">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sticky top-24">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-slate-800">Filters</h3>
            {activeFiltersCount > 0 && (
              <Badge variant="primary" size="sm">
                {activeFiltersCount} active
              </Badge>
            )}
          </div>
          <FilterContent {...filterContentProps} />
        </div>
      </aside>

      <div className="lg:hidden sticky top-16 z-30 bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search hostels..."
              value={filters.search || ""}
              onChange={(e) => updateFilter("search", e.target.value)}
              leftIcon={<Search className="w-5 h-5" />}
              className="h-10"
            />
          </div>

          <Button
            variant="outline"
            onClick={() => setShowMobileFilters(true)}
            className="relative"
          >
            <SlidersHorizontal className="w-5 h-5" />
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </Button>

          <div className="hidden sm:block w-40">
            <Select
              options={sortOptions}
              value={filters.sortBy || "rating"}
              onChange={(value) =>
                updateFilter("sortBy", value as Filters["sortBy"])
              }
            />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showMobileFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setShowMobileFilters(false)}
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-white z-50 lg:hidden overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-slate-800">
                    Filters
                  </h3>
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Sort By
                  </label>
                  <Select
                    options={sortOptions}
                    value={filters.sortBy || "rating"}
                    onChange={(value) =>
                      updateFilter("sortBy", value as Filters["sortBy"])
                    }
                  />
                </div>

                <FilterContent {...filterContentProps} />

                <div className="mt-8 pt-6 border-t border-slate-100">
                  <Button
                    fullWidth
                    onClick={() => {
                      onSearch();
                      setShowMobileFilters(false);
                    }}
                    isLoading={isLoading}
                  >
                    Show {totalResults} Results
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
