"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHostelSaveStatus } from "@/hooks/useSavedHostels";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

interface SaveButtonProps {
  hostelId: string;
  className?: string;
  showTooltip?: boolean;
}

export function SaveButton({
  hostelId,
  className,
  showTooltip = true,
}: SaveButtonProps) {
  const { isAuthenticated, user } = useAuth();
  const { isSaved, isLoading, toggle } = useHostelSaveStatus(hostelId);

  const canSave = user?.role === "STUDENT" || user?.role === "GUEST";

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error("Please log in to save hostels");
      return;
    }

    if (!canSave) {
      toast.error("Only students and guests can save hostels");
      return;
    }

    await toggle();
  };

  const getTooltipText = () => {
    if (!isAuthenticated) return "Sign in to save";
    if (!canSave) return "Only students and guests can save";
    return isSaved ? "Remove from saved" : "Save hostel";
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      title={showTooltip ? getTooltipText() : undefined}
      className={cn(
        "w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition-all hover:scale-110",
        isLoading && "opacity-50 cursor-not-allowed",
        className,
      )}
    >
      <Heart
        className={cn(
          "w-4 h-4 transition-colors",
          isSaved ? "fill-red-500 text-red-500" : "text-slate-400",
        )}
      />
    </button>
  );
}