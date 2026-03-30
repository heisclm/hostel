"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  CreditCard,
  Users,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  Banknote,
  Calendar,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ArrowLeftRight,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";
import type { PlatformStat } from "@/services/admin.service";

function formatCurrency(amount: number) {
  return `GHS ${amount.toLocaleString()}`;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  CreditCard,
  Banknote,
  Building2,
  Users,
  Calendar,
  UserCheck,
};

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-9 w-44" />
          <Skeleton className="h-9 w-40" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border p-4">
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <Skeleton className="w-16 h-4" />
            </div>
            <Skeleton className="h-8 w-24 mb-1" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border p-6">
        <Skeleton className="h-5 w-40 mb-4" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i}>
              <Skeleton className="h-3 w-24 mb-1" />
              <Skeleton className="h-7 w-32 mb-1" />
              <Skeleton className="h-3 w-28" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border">
            <div className="px-6 py-4 border-b">
              <Skeleton className="h-5 w-36" />
            </div>
            <div className="divide-y">
              {[...Array(5)].map((_, j) => (
                <div key={j} className="px-6 py-3 flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-5 w-20" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-100] text-center">
      <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
      <h2 className="text-xl font-semibold text-slate-800 mb-2">
        Failed to load dashboard
      </h2>
      <p className="text-slate-500 mb-4">
        There was an error loading the admin dashboard.
      </p>
      <Button onClick={onRetry} variant="outline">
        <RefreshCw className="w-4 h-4 mr-2" />
        Try Again
      </Button>
    </div>
  );
}

function StatCard({ stat, index }: { stat: PlatformStat; index: number }) {
  const IconComponent = iconMap[stat.icon] || CreditCard;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn("bg-white rounded-xl border p-4", stat.border)}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={cn("p-2 rounded-lg", stat.bg)}>
          <IconComponent className={cn("w-4 h-4", stat.color)} />
        </div>
        {stat.trending === "up" && (
          <span className="flex items-center gap-0.5 text-xs font-medium text-green-600">
            <ArrowUpRight className="w-3 h-3" />
            {stat.change}
          </span>
        )}
        {stat.trending === "down" && (
          <span className="flex items-center gap-0.5 text-xs font-medium text-red-600">
            <ArrowDownRight className="w-3 h-3" />
            {stat.change}
          </span>
        )}
        {stat.trending === "neutral" && (
          <span className="text-xs font-medium text-amber-600">
            {stat.change}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-800">
        {stat.label === "Total Revenue" ||
        stat.label === "Pending Disbursements"
          ? formatCurrency(stat.value)
          : stat.value.toLocaleString()}
      </p>
      <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
    </motion.div>
  );
}

export default function AdminDashboardPage() {
  const { data, isLoading, error, refetch } = useAdminDashboard();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error || !data) {
    return <ErrorState onRetry={refetch} />;
  }

  const {
    platformStats,
    financialSummary,
    recentPayments,
    pendingDisbursements,
    pendingVerifications,
    escalatedComplaints,
  } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
          <p className="text-slate-500 mt-1">
            Platform overview and management
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/disbursements">
            <Button
              variant="outline"
              size="sm"
              className="text-amber-700 border-amber-300 hover:bg-amber-50"
            >
              <Banknote className="w-4 h-4 mr-2" />
              Process Disbursements
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {platformStats.map((stat, i) => (
          <StatCard key={stat.label} stat={stat} index={i} />
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-sm font-semibold text-slate-800 mb-4">
          Financial Overview
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-xs text-slate-400 mb-1">Total Received</p>
            <p className="text-xl font-bold text-green-600">
              {formatCurrency(financialSummary.totalReceived)}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              This month: {formatCurrency(financialSummary.thisMonthReceived)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">Total Disbursed</p>
            <p className="text-xl font-bold text-blue-600">
              {formatCurrency(financialSummary.totalDisbursed)}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              This month: {formatCurrency(financialSummary.thisMonthDisbursed)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">Platform Balance</p>
            <p className="text-xl font-bold text-amber-600">
              {formatCurrency(financialSummary.platformBalance)}
            </p>
            <p className="text-xs text-slate-400 mt-1">Awaiting disbursement</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">
              Commission ({financialSummary.commissionRate}%)
            </p>
            <p className="text-xl font-bold text-purple-600">
              {formatCurrency(financialSummary.platformCommission)}
            </p>
            <p className="text-xs text-slate-400 mt-1">Total earned</p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-slate-50 rounded-xl">
          <div className="flex items-center justify-center gap-4 text-sm">
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-1">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <p className="font-medium text-slate-700">Students Pay</p>
              <p className="text-xs text-slate-400">via MoMo</p>
            </div>
            <ArrowLeftRight className="w-5 h-5 text-slate-300" />
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-1">
                <Building2 className="w-5 h-5 text-primary-600" />
              </div>
              <p className="font-medium text-slate-700">HostelHub</p>
              <p className="text-xs text-slate-400">
                Holds {formatCurrency(financialSummary.platformBalance)}
              </p>
            </div>
            <ArrowLeftRight className="w-5 h-5 text-slate-300" />
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-1">
                <Banknote className="w-5 h-5 text-amber-600" />
              </div>
              <p className="font-medium text-slate-700">Managers Receive</p>
              <p className="text-xs text-slate-400">via MoMo</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Recent Payments</h2>
            <Link
              href="/admin/payments"
              className="text-xs text-primary-600 font-medium hover:underline flex items-center gap-1"
            >
              View All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentPayments.length === 0 ? (
              <div className="px-6 py-8 text-center text-slate-500">
                No recent payments
              </div>
            ) : (
              recentPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="px-6 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={payment.studentName} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {payment.studentName}
                      </p>
                      <p className="text-xs text-slate-400">
                        {payment.method} → {payment.hostelName}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-600">
                      +{formatCurrency(payment.amount)}
                    </p>
                    <div className="flex items-center gap-1 justify-end">
                      {payment.disbursed ? (
                        <Badge variant="success" size="sm">
                          Disbursed
                        </Badge>
                      ) : (
                        <Badge variant="warning" size="sm">
                          Pending
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-amber-200">
          <div className="px-6 py-4 border-b border-amber-100 bg-amber-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Banknote className="w-5 h-5 text-amber-600" />
              <h2 className="font-semibold text-slate-800">
                Pending Disbursements
              </h2>
            </div>
            <Link
              href="/admin/disbursements"
              className="text-xs text-primary-600 font-medium hover:underline flex items-center gap-1"
            >
              Process All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {pendingDisbursements.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-sm text-slate-500">
                  All disbursements are up to date
                </p>
              </div>
            ) : (
              pendingDisbursements.map((item) => (
                <div
                  key={item.id}
                  className="px-6 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={item.managerName} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {item.managerName}
                      </p>
                      <p className="text-xs text-slate-400">
                        {item.hostelName} · {item.paymentCount} payments
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-amber-600">
                      {formatCurrency(item.amount)}
                    </p>
                    <p className="text-xs text-slate-400">
                      {item.network} · {item.momoNumber}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          {pendingDisbursements.length > 0 && (
            <div className="px-6 py-3 border-t border-amber-100 bg-amber-50/30">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">
                  Total
                </span>
                <span className="text-lg font-bold text-amber-700">
                  {formatCurrency(
                    pendingDisbursements.reduce((s, d) => s + d.amount, 0),
                  )}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">
              Pending Verifications
            </h2>
            <Link
              href="/admin/verifications"
              className="text-xs text-primary-600 font-medium hover:underline flex items-center gap-1"
            >
              Review All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {pendingVerifications.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-sm text-slate-500">
                  No pending verifications
                </p>
              </div>
            ) : (
              pendingVerifications.map((item) => (
                <div
                  key={item.id}
                  className="px-6 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center",
                        item.type === "hostel" ? "bg-blue-50" : "bg-purple-50",
                      )}
                    >
                      {item.type === "hostel" ? (
                        <Building2 className="w-4 h-4 text-blue-600" />
                      ) : (
                        <UserCheck className="w-4 h-4 text-purple-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {item.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {item.type === "hostel"
                          ? `by ${item.submittedBy}`
                          : "Manager Registration"}{" "}
                        · {item.location}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={item.type === "hostel" ? "primary" : "secondary"}
                      size="sm"
                    >
                      {item.type}
                    </Badge>
                    <p className="text-xs text-slate-400">
                      {formatDate(item.date)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-red-200">
          <div className="px-6 py-4 border-b border-red-100 bg-red-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h2 className="font-semibold text-slate-800">
                Escalated Complaints
              </h2>
            </div>
            <Link
              href="/admin/complaints"
              className="text-xs text-primary-600 font-medium hover:underline flex items-center gap-1"
            >
              View All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {escalatedComplaints.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-sm text-slate-500">
                  No escalated complaints
                </p>
              </div>
            ) : (
              escalatedComplaints.map((complaint) => (
                <div
                  key={complaint.id}
                  className="px-6 py-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-sm font-medium text-slate-800">
                      {complaint.title}
                    </h3>
                    <Badge
                      variant={
                        complaint.priority === "urgent" ? "error" : "warning"
                      }
                      size="sm"
                    >
                      {complaint.priority}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span>{complaint.hostelName}</span>
                    <span>·</span>
                    <span>{complaint.tenantName}</span>
                    <span>·</span>
                    <span className="text-red-500 font-medium">
                      {complaint.daysOpen} days open
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
