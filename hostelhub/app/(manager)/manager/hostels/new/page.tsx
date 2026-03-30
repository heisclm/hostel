"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import HostelForm from "@/components/hostels/HostelForm";

export default function AddNewHostelPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Hostels
        </button>
        <h1 className="text-2xl font-bold text-slate-800">Add New Hostel</h1>
        <p className="text-slate-500 mt-1">
          List your hostel on HostelHub and start receiving bookings from
          students
        </p>
      </div>

      <HostelForm />
    </div>
  );
}
