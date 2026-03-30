"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Building2,
  GraduationCap,
  ArrowRight,
  Check,
  Users,
} from "lucide-react";
import { Logo } from "@/components/ui";

const registrationOptions = [
  {
    id: "student",
    href: "/register/student",
    icon: GraduationCap,
    title: "I'm a Student",
    description:
      "Looking for verified hostels near Catholic University of Ghana. Book rooms, view amenities, and connect with landlords.",
    benefits: [
      "Browse verified hostels",
      "Instant booking & payments",
      "View reviews & ratings",
    ],
    colorScheme: {
      gradient: "from-primary-500 to-primary-600",
      border: "hover:border-primary-400",
      bg: "bg-primary-100",
      text: "text-primary-600",
    },
    cta: "Continue as Student",
  },

  {
    id: "guest",
    href: "/register/guest",
    icon: Users,
    title: "I'm a Guest",
    description:
      "Parents, guardians, university staff, or prospective students exploring accommodation options.",
    benefits: [
      "Browse hostel listings",
      "Contact hostel managers",
      "Save favorite hostels",
    ],
    colorScheme: {
      gradient: "from-violet-500 to-violet-600",
      border: "hover:border-violet-400",
      bg: "bg-violet-100",
      text: "text-violet-600",
    },
    cta: "Continue as Guest",
  },

  {
    id: "manager",
    href: "/register/manager",
    icon: Building2,
    title: "I'm a Hostel Manager",
    description:
      "List your hostel, manage bookings, and reach hundreds of CUG students looking for accommodation.",
    benefits: [
      "List unlimited properties",
      "Manage bookings easily",
      "Receive online payments",
    ],
    colorScheme: {
      gradient: "from-secondary-500 to-secondary-600",
      border: "hover:border-secondary-400",
      bg: "bg-secondary-100",
      text: "text-secondary-600",
    },
    cta: "Continue as Manager",
  },
];

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-5">
      <div className="max-w-6xl mx-auto w-full">
        <div className="flex justify-center mb-8">
          <Link href="/">
            <Logo />
          </Link>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
            Join HostelHub
          </h1>
          <p className="text-slate-600 text-lg">
            Choose how you&apos;d like to get started
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {registrationOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Link key={option.id} href={option.href}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`group relative overflow-hidden bg-white rounded-3xl border-2 border-slate-200 ${option.colorScheme.border} p-8 text-left transition-all shadow-sm hover:shadow-xl cursor-pointer h-full`}
                >
                  <div
                    className={`absolute top-0 right-0 w-32 h-32 ${option.colorScheme.bg} rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity`}
                  />

                  <div className="relative z-10">
                    <div
                      className={`w-16 h-16 bg-gradient-to-br ${option.colorScheme.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="w-8 h-8 text-white" />
                    </div>

                    <h3 className="text-2xl font-bold text-slate-900 mb-3">
                      {option.title}
                    </h3>
                    <p className="text-slate-600 mb-6 leading-relaxed">
                      {option.description}
                    </p>

                    <div className="space-y-2 mb-6">
                      {option.benefits.map((benefit, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 text-sm text-slate-600"
                        >
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          {benefit}
                        </div>
                      ))}
                    </div>

                    <div
                      className={`flex items-center gap-2 ${option.colorScheme.text} font-semibold group-hover:gap-3 transition-all`}
                    >
                      {option.cta}
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500">
            <span className="font-medium">Guest accounts include:</span> Parents
            & Guardians, University Staff, Prospective Students, and Visitors
          </p>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-primary-600 font-medium hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
