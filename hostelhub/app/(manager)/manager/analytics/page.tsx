"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  CreditCard,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Bed,
  Star,
  Eye,
} from "lucide-react";

import { cn } from "@/lib/utils";

function formatCurrency(amount: number) {
  return `GHS ${amount.toLocaleString()}`;
}

type TimePeriod = "7d" | "30d" | "90d" | "1y";

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<TimePeriod>("30d");

  const kpis = [
    {
      label: "Total Revenue",
      value: formatCurrency(171000),
      change: "+12.5%",
      trending: "up" as const,
      icon: CreditCard,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Occupancy Rate",
      value: "82%",
      change: "+5.2%",
      trending: "up" as const,
      icon: Bed,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Total Bookings",
      value: "156",
      change: "+8.1%",
      trending: "up" as const,
      icon: Calendar,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Avg. Rating",
      value: "4.5",
      change: "-0.1",
      trending: "down" as const,
      icon: Star,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
    },
    {
      label: "Active Tenants",
      value: "96",
      change: "+3",
      trending: "up" as const,
      icon: Users,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      label: "Page Views",
      value: "2,456",
      change: "+18.3%",
      trending: "up" as const,
      icon: Eye,
      color: "text-pink-600",
      bg: "bg-pink-50",
    },
  ];

  const revenueByMonth = [
    { month: "Aug", value: 22000 },
    { month: "Sep", value: 28000 },
    { month: "Oct", value: 30500 },
    { month: "Nov", value: 27000 },
    { month: "Dec", value: 24500 },
    { month: "Jan", value: 28500 },
  ];
  const maxRevenue = Math.max(...revenueByMonth.map((r) => r.value));

  const hostelPerformance = [
    {
      name: "Sunrise Hostel",
      occupancy: 85,
      revenue: 108000,
      bookings: 98,
      rating: 4.5,
      complaints: 5,
    },
    {
      name: "Palm Heights",
      occupancy: 78,
      revenue: 63000,
      bookings: 58,
      rating: 4.3,
      complaints: 3,
    },
  ];

  const bookingsByRoom = [
    { type: "Single", count: 72, percentage: 46 },
    { type: "Double", count: 48, percentage: 31 },
    { type: "Triple", count: 24, percentage: 15 },
    { type: "Quad", count: 12, percentage: 8 },
  ];

  const paymentMethods = [
    {
      method: "Mobile Money",
      count: 89,
      percentage: 57,
      color: "bg-yellow-500",
    },
    {
      method: "Bank Transfer",
      count: 38,
      percentage: 24,
      color: "bg-blue-500",
    },
    { method: "Card", count: 18, percentage: 12, color: "bg-purple-500" },
    { method: "Cash", count: 11, percentage: 7, color: "bg-green-500" },
  ];

  const recentActivity = [
    {
      type: "booking",
      message: "New booking from Nana Agyei for Sunrise Hostel",
      time: "2 hours ago",
    },
    {
      type: "payment",
      message: "Payment of GHS 3,500 received from Ama Mensah",
      time: "3 hours ago",
    },
    {
      type: "complaint",
      message: "New complaint: Water supply issue in Block B",
      time: "5 hours ago",
    },
    {
      type: "checkout",
      message: "Efua Owusu checked out from Palm Heights",
      time: "1 day ago",
    },
    {
      type: "review",
      message: "New 5-star review for Sunrise Hostel",
      time: "1 day ago",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Analytics</h1>
          <p className="text-slate-500 mt-1">
            Track performance across all your hostels
          </p>
        </div>
        <div className="flex gap-1 bg-white rounded-lg border border-slate-200 p-1">
          {(
            [
              { value: "7d", label: "7 Days" },
              { value: "30d", label: "30 Days" },
              { value: "90d", label: "90 Days" },
              { value: "1y", label: "1 Year" },
            ] as const
          ).map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                period === p.value
                  ? "bg-primary-600 text-white"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-xl border border-slate-200 p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={cn("p-2 rounded-lg", kpi.bg)}>
                <kpi.icon className={cn("w-4 h-4", kpi.color)} />
              </div>
              <span
                className={cn(
                  "flex items-center gap-0.5 text-xs font-medium",
                  kpi.trending === "up" ? "text-green-600" : "text-red-500",
                )}
              >
                {kpi.trending === "up" ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {kpi.change}
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-800">{kpi.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{kpi.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-800 mb-6">Revenue Overview</h3>
        <div className="flex items-end gap-3 h-48">
          {revenueByMonth.map((item) => (
            <div
              key={item.month}
              className="flex-1 flex flex-col items-center gap-2"
            >
              <p className="text-xs font-medium text-slate-700">
                {formatCurrency(item.value)}
              </p>
              <motion.div
                initial={{ height: 0 }}
                animate={{
                  height: `${(item.value / maxRevenue) * 100}%`,
                }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full bg-primary-500 rounded-t-lg min-h-2"
              />
              <p className="text-xs text-slate-500">{item.month}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 mb-4">
            Hostel Performance
          </h3>
          <div className="space-y-6">
            {hostelPerformance.map((hostel) => (
              <div key={hostel.name} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-slate-800">{hostel.name}</h4>
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-medium">{hostel.rating}</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-lg font-bold text-slate-800">
                      {hostel.occupancy}%
                    </p>
                    <p className="text-xs text-slate-500">Occupancy</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-800">
                      {hostel.bookings}
                    </p>
                    <p className="text-xs text-slate-500">Bookings</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-800">
                      {formatCurrency(hostel.revenue)}
                    </p>
                    <p className="text-xs text-slate-500">Revenue</p>
                  </div>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full"
                    style={{ width: `${hostel.occupancy}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 mb-4">
            Bookings by Room Type
          </h3>
          <div className="space-y-4">
            {bookingsByRoom.map((room) => (
              <div key={room.type} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">{room.type}</span>
                  <span className="font-medium text-slate-800">
                    {room.count} ({room.percentage}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${room.percentage}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full bg-primary-500 rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <h3 className="font-semibold text-slate-800 mb-4">
              Payment Methods
            </h3>
            <div className="space-y-3">
              {paymentMethods.map((pm) => (
                <div key={pm.method} className="flex items-center gap-3">
                  <div className={cn("w-3 h-3 rounded-full", pm.color)} />
                  <span className="flex-1 text-sm text-slate-600">
                    {pm.method}
                  </span>
                  <span className="text-sm font-medium text-slate-800">
                    {pm.percentage}%
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-3 h-3 rounded-full overflow-hidden flex">
              {paymentMethods.map((pm) => (
                <div
                  key={pm.method}
                  className={cn(pm.color)}
                  style={{ width: `${pm.percentage}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">Recent Activity</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {recentActivity.map((activity, i) => (
            <div
              key={i}
              className="px-6 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors"
            >
              <div
                className={cn(
                  "w-2 h-2 rounded-full shrink-0",
                  activity.type === "booking"
                    ? "bg-blue-500"
                    : activity.type === "payment"
                      ? "bg-green-500"
                      : activity.type === "complaint"
                        ? "bg-red-500"
                        : activity.type === "review"
                          ? "bg-yellow-500"
                          : "bg-slate-400",
                )}
              />
              <p className="flex-1 text-sm text-slate-600">
                {activity.message}
              </p>
              <p className="text-xs text-slate-400 shrink-0">{activity.time}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
