/* eslint-disable @typescript-eslint/no-unused-vars */

"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserCheck,
  Search,
  Building2,
  User,
  Eye,
  Check,
  X,
  ChevronDown,
  MapPin,
  Phone,
  Mail,
  FileText,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

type VerificationType = "hostel" | "manager";
type VerificationStatus = "pending" | "approved" | "rejected";

interface Verification {
  id: string;
  type: VerificationType;
  status: VerificationStatus;
  submittedAt: string;
  reviewedAt: string | null;

  name: string;
  email: string;
  phone: string;
  location: string;

  hostelName?: string;
  hostelAddress?: string;
  totalRooms?: number;
  amenities?: string[];
  documents?: string[];
  managerName?: string;

  businessName?: string;
  idType?: string;
  idNumber?: string;
}

const mockVerifications: Verification[] = [
  {
    id: "VER-001",
    type: "hostel",
    status: "pending",
    submittedAt: "2025-01-15T09:00:00Z",
    reviewedAt: null,
    name: "James Appiah",
    email: "james@harmonyhostel.com",
    phone: "+233 55 111 2222",
    location: "Kumasi, Ashanti Region",
    hostelName: "Harmony Hostel",
    hostelAddress: "45 College Road, Ayeduase",
    totalRooms: 35,
    amenities: ["WiFi", "Water", "Security", "Parking"],
    documents: ["Business Registration", "Property Title", "Insurance"],
    managerName: "James Appiah",
  },
  {
    id: "VER-002",
    type: "manager",
    status: "pending",
    submittedAt: "2025-01-14T15:30:00Z",
    reviewedAt: null,
    name: "Grace Osei",
    email: "grace@email.com",
    phone: "+233 24 333 4444",
    location: "Accra, Greater Accra",
    businessName: "Grace Hostel Services",
    idType: "ID Card",
    idNumber: "GHA-XXXXX-XXXX",
  },
  {
    id: "VER-003",
    type: "hostel",
    status: "pending",
    submittedAt: "2025-01-14T10:00:00Z",
    reviewedAt: null,
    name: "Samuel Mensah",
    email: "samuel@victoryhostel.com",
    phone: "+233 50 555 6666",
    location: "Cape Coast, Central Region",
    hostelName: "Victory Hostel",
    hostelAddress: "12 University Drive",
    totalRooms: 24,
    amenities: ["WiFi", "Water", "Electricity"],
    documents: ["Business Registration", "Property Title"],
    managerName: "Samuel Mensah",
  },
  {
    id: "VER-004",
    type: "hostel",
    status: "approved",
    submittedAt: "2025-01-10T08:00:00Z",
    reviewedAt: "2025-01-11T14:00:00Z",
    name: "Kwame Asante",
    email: "kwame@sunrisehostel.com",
    phone: "+233 24 567 8901",
    location: "Kumasi, Ashanti Region",
    hostelName: "Sunrise Hostel",
    hostelAddress: "23 University Avenue, Ayeduase",
    totalRooms: 60,
    amenities: ["WiFi", "Water", "Electricity", "Security", "Parking"],
    documents: ["Business Registration", "Property Title", "Insurance"],
    managerName: "Kwame Asante",
  },
  {
    id: "VER-005",
    type: "manager",
    status: "rejected",
    submittedAt: "2025-01-08T12:00:00Z",
    reviewedAt: "2025-01-09T10:00:00Z",
    name: "Unknown User",
    email: "fake@email.com",
    phone: "+233 00 000 0000",
    location: "Unknown",
    businessName: "N/A",
    idType: "Passport",
    idNumber: "INVALID",
  },
];

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatRelative(dateString: string) {
  const now = new Date();
  const date = new Date(dateString);
  const hours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

function VerificationDetailModal({
  verification,
  onClose,
  onApprove,
  onReject,
}: {
  verification: Verification;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-lg bg-white rounded-2xl shadow-2xl z-50 overflow-y-auto max-h-[90vh]"
      >
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-800">
              Review {verification.type === "hostel" ? "Hostel" : "Manager"}{" "}
              Application
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center gap-2">
            <Badge
              variant={
                verification.status === "pending"
                  ? "warning"
                  : verification.status === "approved"
                    ? "success"
                    : "error"
              }
              size="md"
            >
              {verification.status === "pending" && (
                <Clock className="w-3.5 h-3.5 mr-1.5" />
              )}
              {verification.status === "approved" && (
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
              )}
              {verification.status === "rejected" && (
                <XCircle className="w-3.5 h-3.5 mr-1.5" />
              )}
              {verification.status}
            </Badge>
            <Badge variant="secondary" size="md">
              {verification.type}
            </Badge>
          </div>

          <div className="bg-slate-50 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-slate-800 mb-3">
              Applicant
            </h4>
            <div className="flex items-center gap-3 mb-3">
              <Avatar name={verification.name} size="lg" />
              <div>
                <p className="font-medium text-slate-800">
                  {verification.name}
                </p>
                <p className="text-sm text-slate-500">
                  Submitted {formatRelative(verification.submittedAt)}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Mail className="w-4 h-4 text-slate-400" />
                {verification.email}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Phone className="w-4 h-4 text-slate-400" />
                {verification.phone}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <MapPin className="w-4 h-4 text-slate-400" />
                {verification.location}
              </div>
            </div>
          </div>

          {verification.type === "hostel" && (
            <div>
              <h4 className="text-sm font-semibold text-slate-800 mb-3">
                Hostel Information
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-400">Hostel Name</p>
                  <p className="text-sm font-medium text-slate-800">
                    {verification.hostelName}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-400">Total Rooms</p>
                  <p className="text-sm font-medium text-slate-800">
                    {verification.totalRooms}
                  </p>
                </div>
                <div className="col-span-2 bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-400">Address</p>
                  <p className="text-sm font-medium text-slate-800">
                    {verification.hostelAddress}
                  </p>
                </div>
              </div>

              {verification.amenities && (
                <div className="mt-4">
                  <p className="text-xs text-slate-400 mb-2">Amenities</p>
                  <div className="flex flex-wrap gap-2">
                    {verification.amenities.map((a) => (
                      <Badge key={a} variant="secondary" size="sm">
                        {a}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {verification.documents && (
                <div className="mt-4">
                  <p className="text-xs text-slate-400 mb-2">
                    Submitted Documents
                  </p>
                  <div className="space-y-2">
                    {verification.documents.map((doc) => (
                      <div
                        key={doc}
                        className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2"
                      >
                        <FileText className="w-4 h-4 text-slate-400" />
                        {doc}
                        <button className="ml-auto text-primary-600 text-xs hover:underline">
                          View
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {verification.type === "manager" && (
            <div>
              <h4 className="text-sm font-semibold text-slate-800 mb-3">
                Business Information
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-400">Business Name</p>
                  <p className="text-sm font-medium text-slate-800">
                    {verification.businessName}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-400">ID Type</p>
                  <p className="text-sm font-medium text-slate-800">
                    {verification.idType}
                  </p>
                </div>
                <div className="col-span-2 bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-400">ID Number</p>
                  <p className="text-sm font-medium text-slate-800">
                    {verification.idNumber}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {verification.status === "pending" && (
          <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-slate-100">
            {!showRejectForm ? (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  fullWidth
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => setShowRejectForm(true)}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button
                  fullWidth
                  className="bg-green-600 hover:bg-green-700"
                  onClick={onApprove}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Approve
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Reason for rejection..."
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  rows={3}
                />
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    fullWidth
                    onClick={() => setShowRejectForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    fullWidth
                    className="bg-red-600 hover:bg-red-700"
                    onClick={onReject}
                    disabled={!rejectReason.trim()}
                  >
                    Confirm Rejection
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {verification.status !== "pending" && (
          <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-slate-100">
            <Button variant="outline" fullWidth onClick={onClose}>
              Close
            </Button>
          </div>
        )}
      </motion.div>
    </>
  );
}

export default function VerificationsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<VerificationType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<VerificationStatus | "all">(
    "pending",
  );
  const [selectedVerification, setSelectedVerification] =
    useState<Verification | null>(null);

  const stats = useMemo(
    () => ({
      pending: mockVerifications.filter((v) => v.status === "pending").length,
      approved: mockVerifications.filter((v) => v.status === "approved").length,
      rejected: mockVerifications.filter((v) => v.status === "rejected").length,
    }),
    [],
  );

  const filteredVerifications = useMemo(() => {
    let result = [...mockVerifications];

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (v) =>
          v.name.toLowerCase().includes(s) ||
          v.email.toLowerCase().includes(s) ||
          (v.hostelName && v.hostelName.toLowerCase().includes(s)),
      );
    }

    if (typeFilter !== "all") {
      result = result.filter((v) => v.type === typeFilter);
    }

    if (statusFilter !== "all") {
      result = result.filter((v) => v.status === statusFilter);
    }

    result.sort(
      (a, b) =>
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
    );

    return result;
  }, [search, typeFilter, statusFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Verifications</h1>
        <p className="text-slate-500 mt-1">
          Review and approve hostel and manager applications
        </p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Pending",
            value: stats.pending,
            icon: Clock,
            color: "text-amber-600",
            bg: "bg-amber-50",
            border: "border-amber-200",
          },
          {
            label: "Approved",
            value: stats.approved,
            icon: CheckCircle2,
            color: "text-green-600",
            bg: "bg-green-50",
            border: "border-green-200",
          },
          {
            label: "Rejected",
            value: stats.rejected,
            icon: XCircle,
            color: "text-red-600",
            bg: "bg-red-50",
            border: "border-red-200",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={cn("bg-white rounded-xl border p-4", stat.border)}
          >
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", stat.bg)}>
                <stat.icon className={cn("w-5 h-5", stat.color)} />
              </div>
              <div>
                <p className="text-xs text-slate-500">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-800">
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or hostel..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div className="relative">
          <select
            value={typeFilter}
            onChange={(e) =>
              setTypeFilter(e.target.value as VerificationType | "all")
            }
            className="appearance-none pl-4 pr-10 py-2.5 text-sm border border-slate-200 rounded-lg bg-white cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="hostel">Hostels</option>
            <option value="manager">Managers</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as VerificationStatus | "all")
            }
            className="appearance-none pl-4 pr-10 py-2.5 text-sm border border-slate-200 rounded-lg bg-white cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {filteredVerifications.length > 0 ? (
        <div className="space-y-4">
          {filteredVerifications.map((v) => (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-4 sm:p-6 flex items-start gap-4">
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                    v.type === "hostel" ? "bg-blue-50" : "bg-purple-50",
                  )}
                >
                  {v.type === "hostel" ? (
                    <Building2 className="w-5 h-5 text-blue-600" />
                  ) : (
                    <User className="w-5 h-5 text-purple-600" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-slate-800">
                        {v.type === "hostel" ? v.hostelName : v.name}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {v.type === "hostel"
                          ? `by ${v.managerName}`
                          : v.businessName}{" "}
                        · {v.location}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant={
                          v.status === "pending"
                            ? "warning"
                            : v.status === "approved"
                              ? "success"
                              : "error"
                        }
                        size="sm"
                      >
                        {v.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Submitted {formatRelative(v.submittedAt)}
                    </span>
                    {v.type === "hostel" && v.totalRooms && (
                      <span>{v.totalRooms} rooms</span>
                    )}
                    <span>{v.email}</span>
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  {v.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => alert(`Rejecting ${v.id}`)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => alert(`Approving ${v.id}`)}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  <button
                    onClick={() => setSelectedVerification(v)}
                    className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border py-16 text-center">
          <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            No verifications found
          </h3>
          <p className="text-slate-500">All caught up!</p>
        </div>
      )}

      <AnimatePresence>
        {selectedVerification && (
          <VerificationDetailModal
            verification={selectedVerification}
            onClose={() => setSelectedVerification(null)}
            onApprove={() => {
              alert(`Approved ${selectedVerification.id}`);
              setSelectedVerification(null);
            }}
            onReject={() => {
              alert(`Rejected ${selectedVerification.id}`);
              setSelectedVerification(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
