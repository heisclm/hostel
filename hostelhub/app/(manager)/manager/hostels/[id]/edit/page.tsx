"use client";

import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";

import { useManagerHostelDetail } from "@/hooks/useManagerHostels";
import { Button } from "@/components/ui/Button";
import HostelForm from "@/components/hostels/HostelForm";

export default function EditHostelPage() {
  const router = useRouter();
  const params = useParams();
  const hostelId = params.id as string;

  const { hostel, isLoading, error, refetch } =
    useManagerHostelDetail(hostelId);

  if (isLoading) {
    return (
      <div className="min-h-100 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin mb-3" />
        <p className="text-sm text-slate-500">Loading hostel details...</p>
      </div>
    );
  }

  if (error || !hostel) {
    return (
      <div className="min-h-100 flex flex-col items-center justify-center">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <h3 className="text-lg font-semibold text-slate-800 mb-2">
          Failed to load hostel
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          {error || "Hostel not found or you don't have permission to edit it."}
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.back()}>
            Go Back
          </Button>
          <Button onClick={() => refetch()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Hostel
        </button>
        <h1 className="text-2xl font-bold text-slate-800">
          Edit {hostel.name}
        </h1>
        <p className="text-slate-500 mt-1">
          Update your hostel information. Changes to key details may require
          re-verification.
        </p>
      </div>

      <HostelForm initialData={hostel} isEditing={true} hostelId={hostelId} />
    </div>
  );
}
