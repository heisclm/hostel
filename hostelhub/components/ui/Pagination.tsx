"use client";

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingsCount?: number;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingsCount = 1,
  className,
}: PaginationProps) {
  const generatePages = () => {
    const pages: (number | "dots")[] = [];

    pages.push(1);

    const leftSibling = Math.max(currentPage - siblingsCount, 2);
    const rightSibling = Math.min(currentPage + siblingsCount, totalPages - 1);

    if (leftSibling > 2) {
      pages.push("dots");
    }

    for (let i = leftSibling; i <= rightSibling; i++) {
      if (i !== 1 && i !== totalPages) {
        pages.push(i);
      }
    }

    if (rightSibling < totalPages - 1) {
      pages.push("dots");
    }

    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  if (totalPages <= 1) return null;

  const pages = generatePages();

  return (
    <nav
      className={cn("flex items-center justify-center gap-1", className)}
      aria-label="Pagination"
    >
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-lg transition-colors",
          currentPage === 1
            ? "text-slate-300 cursor-not-allowed"
            : "text-slate-600 hover:bg-slate-100",
        )}
        aria-label="Previous page"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {pages.map((page, index) => {
        if (page === "dots") {
          return (
            <span
              key={`dots-${index}`}
              className="flex items-center justify-center w-10 h-10 text-slate-400"
            >
              <MoreHorizontal className="w-5 h-5" />
            </span>
          );
        }

        return (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-lg text-sm font-medium transition-colors",
              currentPage === page
                ? "bg-primary-600 text-white"
                : "text-slate-600 hover:bg-slate-100",
            )}
            aria-current={currentPage === page ? "page" : undefined}
          >
            {page}
          </button>
        );
      })}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-lg transition-colors",
          currentPage === totalPages
            ? "text-slate-300 cursor-not-allowed"
            : "text-slate-600 hover:bg-slate-100",
        )}
        aria-label="Next page"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </nav>
  );
}
