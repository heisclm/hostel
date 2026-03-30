"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  CreditCard,
  Bell,
  Shield,
  MapPin,
  Star,
  Clock,
  Headphones,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: Search,
    title: "Smart Search & Filter",
    description:
      "Find hostels by price, distance, facilities, and room type. Compare options side by side with our intelligent search.",
    color: "primary",
    gradient: "from-primary-500 to-primary-600",
    highlights: ["Price filters", "Distance sorting", "Room types"],
  },
  {
    icon: Shield,
    title: "100% Verified Hostels",
    description:
      "Every hostel is physically inspected by our team to ensure safety, quality, and accurate listings.",
    color: "emerald",
    gradient: "from-emerald-500 to-green-600",
    highlights: ["Physical inspection", "Safety verified", "Quality assured"],
  },
  {
    icon: CreditCard,
    title: "Secure MoMo Payments",
    description:
      "Pay securely with Mobile Money. Instant confirmation, no cash handling, complete peace of mind.",
    color: "amber",
    gradient: "from-amber-500 to-orange-500",
    highlights: ["MoMo", "Instant confirm", "Zero fraud"],
  },
  {
    icon: Bell,
    title: "Real-time Notifications",
    description:
      "Get instant SMS alerts for booking confirmations, payment receipts, and important updates.",
    color: "purple",
    gradient: "from-purple-500 to-violet-600",
    highlights: ["SMS alerts", "Email updates", "Push notifications"],
  },
  {
    icon: MapPin,
    title: "Campus Distance Info",
    description:
      "See exact distances from each hostel to CUG campus. Plan your daily commute with ease.",
    color: "rose",
    gradient: "from-rose-500 to-pink-600",
    highlights: ["Walking time", "Route info", "Nearby spots"],
  },
  {
    icon: Star,
    title: "Verified Student Reviews",
    description:
      "Read honest reviews from fellow CUG students who have actually lived in these hostels.",
    color: "cyan",
    gradient: "from-cyan-500 to-blue-600",
    highlights: ["Real students", "Honest ratings", "Photo reviews"],
  },
  {
    icon: Clock,
    title: "Live Availability",
    description:
      "Check room availability in real-time. No more visiting hostels only to find them fully booked.",
    color: "teal",
    gradient: "from-teal-500 to-emerald-600",
    highlights: ["Real-time sync", "Instant booking", "No overbooking"],
  },
  {
    icon: Headphones,
    title: "24/7 Student Support",
    description:
      "Our dedicated support team is always ready to help with any questions or issues you may have.",
    color: "indigo",
    gradient: "from-indigo-500 to-blue-600",
    highlights: ["WhatsApp support", "Phone hotline", "Email help"],
  },
];

const colorMap: Record<string, { bg: string; icon: string; border: string }> = {
  primary: {
    bg: "bg-primary-50",
    icon: "text-primary-600",
    border: "border-primary-200",
  },
  emerald: {
    bg: "bg-emerald-50",
    icon: "text-emerald-600",
    border: "border-emerald-200",
  },
  amber: {
    bg: "bg-amber-50",
    icon: "text-amber-600",
    border: "border-amber-200",
  },
  purple: {
    bg: "bg-purple-50",
    icon: "text-purple-600",
    border: "border-purple-200",
  },
  rose: { bg: "bg-rose-50", icon: "text-rose-600", border: "border-rose-200" },
  cyan: { bg: "bg-cyan-50", icon: "text-cyan-600", border: "border-cyan-200" },
  teal: { bg: "bg-teal-50", icon: "text-teal-600", border: "border-teal-200" },
  indigo: {
    bg: "bg-indigo-50",
    icon: "text-indigo-600",
    border: "border-indigo-200",
  },
};

export function FeaturesSection() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section
      className="py-20 lg:py-28 bg-slate-50 overflow-hidden"
      id="features"
    >
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full shadow-sm mb-6"
          >
            <Sparkles className="w-4 h-4 text-primary-500" />
            <span className="text-sm font-medium text-slate-700">
              Why Choose HostelHub
            </span>
          </motion.div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-5">
            Everything You Need to Find{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-primary-600 to-secondary-600">
              Your Perfect Hostel
            </span>
          </h2>
          <p className="text-lg text-slate-600 leading-relaxed">
            We&apos;ve built HostelHub with CUG students in mind. Here&apos;s
            what makes us the best choice for finding off-campus accommodation.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
          {features.map((feature, index) => {
            const colors = colorMap[feature.color];
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="group relative"
              >
                <motion.div
                  whileHover={{ y: -6 }}
                  className="relative h-full bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:border-slate-200 transition-all duration-300 overflow-hidden"
                >
                  <div
                    className={cn(
                      "absolute inset-0 bg-linear-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-300",
                      feature.gradient,
                    )}
                  />

                  <div className="relative z-10">
                    <div
                      className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110",
                        colors.bg,
                      )}
                    >
                      <feature.icon className={cn("w-7 h-7", colors.icon)} />
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-slate-800">
                      {feature.title}
                    </h3>

                    <p className="text-slate-600 text-sm leading-relaxed mb-4">
                      {feature.description}
                    </p>

                    <div className="space-y-2">
                      {feature.highlights.map((highlight, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{
                            opacity: hoveredIndex === index ? 1 : 0.7,
                            x: hoveredIndex === index ? 0 : -5,
                          }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center gap-2"
                        >
                          <CheckCircle2
                            className={cn("w-4 h-4 shrink-0", colors.icon)}
                          />
                          <span className="text-xs font-medium text-slate-600">
                            {highlight}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: hoveredIndex === index ? 1 : 0 }}
                    className="absolute bottom-4 right-4"
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center",
                        colors.bg,
                      )}
                    >
                      <ArrowRight className={cn("w-4 h-4", colors.icon)} />
                    </div>
                  </motion.div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full bg-linear-to-br from-primary-400 to-secondary-500 border-2 border-white"
                  />
                ))}
              </div>
              <div className="text-left">
                <p className="font-semibold text-slate-900">500+ Students</p>
                <p className="text-sm text-slate-500">
                  Already using HostelHub
                </p>
              </div>
            </div>
            <div className="hidden sm:block w-px h-12 bg-slate-200" />
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 text-amber-400 fill-amber-400"
                  />
                ))}
              </div>
              <span className="font-semibold text-slate-900">4.9/5</span>
              <span className="text-slate-500">rating</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
