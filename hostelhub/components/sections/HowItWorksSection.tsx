"use client";

import { motion } from "framer-motion";
import {
  Search,
  Building2,
  CreditCard,
  Key,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

const steps = [
  {
    number: "01",
    icon: Search,
    title: "Search & Explore",
    description:
      "Browse through our verified hostels. Filter by price, distance, facilities, and room type to find your perfect match.",
    color: "from-primary-500 to-primary-600",
    features: ["Advanced filters", "Real photos", "Virtual tours"],
  },
  {
    number: "02",
    icon: Building2,
    title: "Compare & Choose",
    description:
      "Compare multiple hostels side by side. Check amenities, read reviews from fellow students, and make an informed decision.",
    color: "from-secondary-500 to-secondary-600",
    features: [
      "Side-by-side comparison",
      "Student reviews",
      "Facility details",
    ],
  },
  {
    number: "03",
    icon: CreditCard,
    title: "Book & Pay",
    description:
      "Reserve your room instantly with Mobile Money. Secure payment processing with instant confirmation.",
    color: "from-accent-500 to-accent-600",
    features: ["MoMo payment", "Instant confirmation", "SMS receipt"],
  },
  {
    number: "04",
    icon: Key,
    title: "Move In",
    description:
      "Show your booking confirmation to the hostel manager and move into your new home. It's that simple!",
    color: "from-purple-500 to-purple-600",
    features: ["Digital confirmation", "Easy check-in", "24/7 support"],
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-20 lg:py-28 bg-white" id="how-it-works">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-block px-4 py-1.5 bg-secondary-100 text-secondary-700 rounded-full text-sm font-semibold mb-4">
            Simple Process
          </span>
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-800 mb-4">
            Find Your Hostel in{" "}
            <span className="text-gradient-primary">4 Easy Steps</span>
          </h2>
          <p className="text-lg text-slate-600">
            We&apos;ve simplified the hostel booking process so you can focus on
            what matters - your studies.
          </p>
        </motion.div>

        <div className="relative">
          <div className="hidden lg:block absolute top-24 left-0 right-0 h-0.5 bg-linear-to-r from-primary-200 via-secondary-200 to-accent-200" />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="relative"
              >
                <div className="bg-slate-50 rounded-2xl p-6 h-full hover:shadow-medium transition-shadow duration-300">
                  <div className="relative mb-6">
                    <div
                      className={`w-16 h-16 rounded-2xl bg-linear-to-br ${step.color} flex items-center justify-center shadow-lg`}
                    >
                      <step.icon className="w-8 h-8 text-white" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center text-sm font-bold text-slate-800 shadow-md border-2 border-slate-100">
                      {step.number}
                    </span>
                  </div>

                  <h3 className="text-xl font-semibold text-slate-800 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-slate-600 text-sm mb-4 leading-relaxed">
                    {step.description}
                  </p>

                  <ul className="space-y-2">
                    {step.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-2 text-sm text-slate-600"
                      >
                        <CheckCircle2 className="w-4 h-4 text-secondary-500 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden lg:flex absolute -right-3 top-24 w-6 h-6 bg-white rounded-full items-center justify-center shadow-md z-10">
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-16 text-center"
        >
          <p className="text-slate-600 mb-4">
            Ready to find your perfect hostel?
          </p>
          <Button
            size="xl"
            rightIcon={<ArrowRight className="w-5 h-5" />}
            asChild
          >
            <Link href="/hostels">Start Searching Now</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
