"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  CreditCard,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  AlertCircle,
  ChevronRight,
  Eye,
  Bed,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  useManagerDashboard,
  useManagerProfile,
} from "@/hooks/useManagerDashboard";

const statusColors: Record<string, string> = {
  confirmed: "bg-green-100 text-green-700",
  checked_in: "bg-blue-100 text-blue-700",
  pending: "bg-amber-100 text-amber-700",
  pending_payment: "bg-amber-100 text-amber-700",
  cancelled: "bg-red-100 text-red-700",
  completed: "bg-gray-100 text-gray-700",
};

const statIcons = {
  totalRevenue: CreditCard,
  activeBookings: Calendar,
  totalTenants: Users,
  occupancyRate: TrendingUp,
};

const statColors = {
  totalRevenue: "bg-green-100 text-green-600",
  activeBookings: "bg-blue-100 text-blue-600",
  totalTenants: "bg-purple-100 text-purple-600",
  occupancyRate: "bg-amber-100 text-amber-600",
};

const statLabels = {
  totalRevenue: "Total Revenue",
  activeBookings: "Active Bookings",
  totalTenants: "Total Tenants",
  occupancyRate: "Occupancy Rate",
};

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent>
              <div className="flex items-start justify-between">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <Skeleton className="w-16 h-5" />
              </div>
              <div className="mt-4">
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-3">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-36" />
          </CardHeader>
          <CardContent>
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 mb-3" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ErrorState({
  onRetry,
  isRetrying,
}: {
  onRetry: () => void;
  isRetrying: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-100 text-center">
      <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
      <h2 className="text-xl font-semibold text-slate-800 mb-2">
        Failed to load dashboard
      </h2>
      <p className="text-slate-500 mb-4">
        There was an error loading your dashboard data.
      </p>
      <Button onClick={onRetry} variant="outline" disabled={isRetrying}>
        <RefreshCw
          className={`w-4 h-4 mr-2 ${isRetrying ? "animate-spin" : ""}`}
        />
        {isRetrying ? "Retrying..." : "Try Again"}
      </Button>
    </div>
  );
}

export default function ManagerDashboard() {
  const {
    data: dashboard,
    isLoading: isDashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useManagerDashboard();

  const { data: profile, isLoading: isProfileLoading } = useManagerProfile();

  if (isDashboardLoading || isProfileLoading) {
    return <DashboardSkeleton />;
  }

  if (dashboardError || !dashboard) {
    return (
      <ErrorState onRetry={refetchDashboard} isRetrying={isDashboardLoading} />
    );
  }

  const userName = profile?.firstName || "Manager";

  const formatStatValue = (key: string, value: number): string => {
    if (key === "totalRevenue") {
      return formatCurrency(value);
    }
    if (key === "occupancyRate") {
      return `${value}%`;
    }
    return value.toString();
  };

  const formatChange = (key: string, change: number): string => {
    if (key === "totalRevenue" || key === "occupancyRate") {
      return `${change >= 0 ? "+" : ""}${change}%`;
    }
    return `${change >= 0 ? "+" : ""}${change}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">
            Welcome back, {userName}! 👋
          </h1>
          <p className="text-slate-500 mt-1">
            Here&apos;s what&apos;s happening with your hostels today
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/manager/hostels/new">Add Hostel</Link>
          </Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(
          Object.keys(dashboard.stats) as Array<keyof typeof dashboard.stats>
        ).map((key, index) => {
          const stat = dashboard.stats[key];
          const Icon = statIcons[key];
          const color = statColors[key];
          const label = statLabels[key];

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent>
                  <div className="flex items-start justify-between">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <div
                      className={`flex items-center gap-1 text-sm font-medium ${
                        stat.changeType === "positive"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {stat.changeType === "positive" ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4" />
                      )}
                      {formatChange(key, stat.change)}
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-2xl font-bold text-slate-800">
                      {formatStatValue(key, stat.value)}
                    </p>
                    <p className="text-sm text-slate-500">{label}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Bookings</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/manager/bookings">
                    View All
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {dashboard.recentBookings.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No recent bookings</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">
                          Student
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">
                          Hostel / Room
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">
                          Amount
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">
                          Status
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">
                          Date
                        </th>
                        <th className="py-3 px-4"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.recentBookings.map((booking) => (
                        <tr
                          key={booking.id}
                          className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <Avatar name={booking.occupantName} size="sm" />
                              <span className="font-medium text-slate-800">
                                {booking.occupantName}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <p className="text-sm text-slate-800">
                              {booking.hostelName}
                            </p>
                            <p className="text-xs text-slate-500">
                              {booking.roomType}
                            </p>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-medium text-slate-800">
                              {formatCurrency(booking.amount)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              className={
                                statusColors[booking.status] ||
                                "bg-gray-100 text-gray-700"
                              }
                              size="sm"
                            >
                              {booking.status.replace(/_/g, " ")}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-500">
                            {formatDate(new Date(booking.date))}
                          </td>
                          <td className="py-3 px-4">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/manager/bookings/${booking.id}`}>
                                <Eye className="w-4 h-4" />
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                Pending Actions
                {dashboard.pendingCounts.bookings +
                  dashboard.pendingCounts.complaints +
                  dashboard.pendingCounts.payments >
                  0 && (
                  <Badge variant="warning" size="sm">
                    {dashboard.pendingCounts.bookings +
                      dashboard.pendingCounts.complaints +
                      dashboard.pendingCounts.payments}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboard.pendingActions.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No pending actions</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {dashboard.pendingActions.map((action) => (
                    <div
                      key={action.id}
                      className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl"
                    >
                      <div
                        className={`w-2 h-2 rounded-full mt-2 ${
                          action.type === "booking"
                            ? "bg-blue-500"
                            : action.type === "complaint"
                              ? "bg-red-500"
                              : "bg-amber-500"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800">
                          {action.title}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {action.description}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {action.time}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={action.href}>{action.action}</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>My Hostels</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/manager/hostels">
                Manage All
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {dashboard.hostels.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Bed className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No hostels yet</p>
              <p className="mb-4">Start by adding your first hostel</p>
              <Button asChild>
                <Link href="/manager/hostels/new">Add Hostel</Link>
              </Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {dashboard.hostels.map((hostel) => (
                <Link
                  key={hostel.id}
                  href={`/manager/hostels/${hostel.id}`}
                  className="block"
                >
                  <div className="border border-slate-200 rounded-xl p-4 hover:border-primary-300 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-slate-800">
                          {hostel.name}
                        </h3>
                        <p className="text-sm text-slate-500">
                          {hostel.address}
                        </p>
                      </div>
                      <Badge
                        variant={
                          hostel.status === "APPROVED" ? "success" : "warning"
                        }
                        size="sm"
                      >
                        {hostel.status.toLowerCase()}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-slate-600">
                          <Bed className="w-4 h-4" />
                          <span className="text-lg font-semibold">
                            {hostel.occupiedRooms}/{hostel.totalRooms}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">Rooms</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-blue-600">
                          <Calendar className="w-4 h-4" />
                          <span className="text-lg font-semibold">
                            {hostel.bookingsCount}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">Bookings</p>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-amber-600">
                          {hostel.occupancyRate}%
                        </div>
                        <p className="text-xs text-slate-500">Occupancy</p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                        <span>Occupancy</span>
                        <span>{hostel.occupancyRate}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-full transition-all duration-500"
                          style={{ width: `${hostel.occupancyRate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
