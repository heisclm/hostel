"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import {
  Building2,
  Users,
  Star,
  Shield,
  TrendingUp,
  Award,
  Clock,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";

const stats = [
  {
    icon: Building2,
    value: 50,
    suffix: "+",
    label: "Verified Hostels",
    description: "Inspected & approved",
    gradient: "from-primary-500 to-primary-600",
    iconBg: "bg-primary-500/20",
    iconColor: "text-primary-400",
  },
  {
    icon: Users,
    value: 500,
    suffix: "+",
    label: "Happy Students",
    description: "Housed this semester",
    gradient: "from-secondary-500 to-secondary-600",
    iconBg: "bg-secondary-500/20",
    iconColor: "text-secondary-400",
  },
  {
    icon: Star,
    value: 4.8,
    suffix: "/5",
    label: "Average Rating",
    description: "From verified reviews",
    gradient: "from-amber-500 to-orange-500",
    iconBg: "bg-amber-500/20",
    iconColor: "text-amber-400",
  },
  {
    icon: Shield,
    value: 100,
    suffix: "%",
    label: "Secure Payments",
    description: "MoMo protected",
    gradient: "from-emerald-500 to-green-500",
    iconBg: "bg-emerald-500/20",
    iconColor: "text-emerald-400",
  },
];

const highlights = [
  { icon: TrendingUp, label: "Fast Growing", value: "2x" },
  { icon: Award, label: "Top Rated", value: "#1" },
  { icon: Clock, label: "Avg Response", value: "2hrs" },
  { icon: MapPin, label: "Campus Area", value: "5km" },
];

function AnimatedNumber({ value, suffix }: { value: number; suffix: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      const duration = 2000;
      const steps = 60;
      const stepValue = value / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += stepValue;
        if (current >= value) {
          setDisplayValue(value);
          clearInterval(timer);
        } else {
          setDisplayValue(Number(current.toFixed(1)));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [isInView, value]);

  return (
    <span ref={ref}>
      {Number.isInteger(value) ? Math.floor(displayValue) : displayValue}
      {suffix}
    </span>
  );
}

export function StatsSection() {
  return (
    <section className="relative py-20 lg:py-28 bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size:3rem_3rem" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-secondary-500/10 rounded-full blur-[80px]" />

      <div className="container-custom relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full mb-6"
          >
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-white">
              Growing Every Day
            </span>
          </motion.div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Numbers That{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-primary-400 to-secondary-400">
              Speak
            </span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Join the growing community of CUG students who trust HostelHub for
            their accommodation needs.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300"
            >
              <div
                className={cn(
                  "absolute inset-0 rounded-2xl bg-linear-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-300",
                  stat.gradient,
                )}
              />

              <div className="relative z-10">
                <div
                  className={cn(
                    "w-14 h-14 rounded-xl flex items-center justify-center mb-4",
                    stat.iconBg,
                  )}
                >
                  <stat.icon className={cn("w-7 h-7", stat.iconColor)} />
                </div>

                <div className="text-4xl lg:text-5xl font-bold text-white mb-1">
                  <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                </div>

                <p className="text-lg font-semibold text-white mb-1">
                  {stat.label}
                </p>
                <p className="text-sm text-slate-400">{stat.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap justify-center gap-6 lg:gap-12"
        >
          {highlights.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                <item.icon className="w-5 h-5 text-slate-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-white">{item.value}</p>
                <p className="text-xs text-slate-500">{item.label}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
