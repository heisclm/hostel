"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HelpCircle,
  Search,
  ChevronDown,
  ChevronRight,
  Book,
  MessageCircle,
  Phone,
  Mail,
  CreditCard,
  Users,
  Calendar,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FAQ {
  question: string;
  answer: string;
}

interface HelpCategory {
  title: string;
  icon: React.ElementType;
  description: string;
  faqs: FAQ[];
}

const helpCategories: HelpCategory[] = [
  {
    title: "Getting Started",
    icon: Book,
    description: "Learn how to set up and manage your hostel listings",
    faqs: [
      {
        question: "How do I list a new hostel?",
        answer:
          'Navigate to "My Hostels" and click "Add New Hostel." Fill in all required details including hostel name, location, room types, pricing, amenities, and upload photos. Once submitted, our team will review and verify your listing within 24-48 hours.',
      },
      {
        question: "What documents do I need to register?",
        answer:
          "You'll need: 1) A valid government-issued ID, 2) Proof of property ownership or management authorization, 3) Business registration certificate, 4) Recent utility bills for the property address.",
      },
      {
        question: "How long does verification take?",
        answer:
          "Verification typically takes 24-48 business hours. We may contact you for additional documentation if needed. You'll receive an email notification once your hostel is verified.",
      },
    ],
  },
  {
    title: "Managing Bookings",
    icon: Calendar,
    description: "Handle bookings, check-ins, and check-outs",
    faqs: [
      {
        question: "How do I approve or reject a booking?",
        answer:
          'Go to the Bookings page, find the pending booking, and click "Approve" or "Reject." You can also view full booking details before making a decision. The student will be notified automatically.',
      },
      {
        question: "Can I set up automatic booking approval?",
        answer:
          'Yes! Go to Settings > Booking Preferences and enable "Auto-approve bookings." You can also set conditions such as requiring full payment before auto-approval.',
      },
      {
        question: "How do I handle check-ins and check-outs?",
        answer:
          'When a tenant arrives, go to their booking and click "Check In." This updates their status and room availability. For check-outs, the process is similar — click "Check Out" and the room will be marked as available.',
      },
    ],
  },
  {
    title: "Payments & Finance",
    icon: CreditCard,
    description: "Payment processing, tracking, and reporting",
    faqs: [
      {
        question: "How do I track payments?",
        answer:
          "The Payments page shows all transactions with their status (completed, pending, failed, refunded). You can filter by date, status, payment method, and export reports for your records.",
      },
      {
        question: "When do I receive my payouts?",
        answer:
          "Payouts are processed weekly every Friday. The funds are transferred to your registered bank account or mobile money number within 1-2 business days after processing.",
      },
      {
        question: "How do I handle refunds?",
        answer:
          "If a booking is cancelled and a refund is warranted, go to the booking details and initiate a refund. Refunds are processed within 3-5 business days. Your refund policy should be clearly stated in your hostel terms.",
      },
    ],
  },
  {
    title: "Tenant Management",
    icon: Users,
    description: "Managing tenants, complaints, and communication",
    faqs: [
      {
        question: "How do I communicate with tenants?",
        answer:
          'Use the built-in messaging system available on the Tenants page. Click "Message" next to any tenant to start a conversation. You can also send bulk notifications to all tenants in a specific hostel.',
      },
      {
        question: "How do I handle complaints?",
        answer:
          "Go to the Complaints page to view all reported issues. You can change status (Open → In Progress → Resolved), respond to tenants, and track resolution times. Prioritize urgent issues marked in red.",
      },
      {
        question: "Can I remove a tenant?",
        answer:
          "Yes, but this should follow your hostel's terms and conditions. Go to the tenant's profile, click the options menu, and select \"Check Out.\" Document the reason for your records. Consider giving adequate notice as per your agreement.",
      },
    ],
  },
  {
    title: "Account & Security",
    icon: Shield,
    description: "Account settings, security, and privacy",
    faqs: [
      {
        question: "How do I update my profile?",
        answer:
          "Go to Settings > Profile to update your personal information, contact details, and profile photo. Changes to business information may require re-verification.",
      },
      {
        question: "How do I change my password?",
        answer:
          'Go to Settings > Security and click "Change Password." You\'ll need to enter your current password and then your new password twice for confirmation.',
      },
      {
        question: "Is my financial data secure?",
        answer:
          "Yes. We use bank-level encryption (256-bit SSL) to protect all financial transactions. We are PCI-DSS compliant and never store complete card details on our servers.",
      },
    ],
  },
];

function FAQItem({ faq }: { faq: FAQ }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-4 text-left hover:text-primary-600 transition-colors"
      >
        <span className="text-sm font-medium text-slate-800 pr-4">
          {faq.question}
        </span>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-slate-400 shrink-0 transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="pb-4 text-sm text-slate-600 leading-relaxed">
              {faq.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function HelpCenterPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredCategories = helpCategories
    .map((category) => ({
      ...category,
      faqs: search
        ? category.faqs.filter(
            (faq) =>
              faq.question.toLowerCase().includes(search.toLowerCase()) ||
              faq.answer.toLowerCase().includes(search.toLowerCase()),
          )
        : category.faqs,
    }))
    .filter((category) => (search ? category.faqs.length > 0 : true));

  return (
    <div className="space-y-6">
      <div className="text-center max-w-2xl mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center mx-auto mb-4">
          <HelpCircle className="w-8 h-8 text-primary-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Help Center</h1>
        <p className="text-slate-500 mt-2">
          Find answers to common questions or reach out to our support team
        </p>

        <div className="relative mt-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search for help..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm"
          />
        </div>
      </div>

      {!search && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {helpCategories.map((category) => (
            <button
              key={category.title}
              onClick={() =>
                setActiveCategory(
                  activeCategory === category.title ? null : category.title,
                )
              }
              className={cn(
                "bg-white rounded-xl border p-6 text-left hover:shadow-md transition-all",
                activeCategory === category.title
                  ? "border-primary-300 ring-2 ring-primary-100"
                  : "border-slate-200",
              )}
            >
              <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center mb-3">
                <category.icon className="w-5 h-5 text-primary-600" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-1">
                {category.title}
              </h3>
              <p className="text-xs text-slate-500">{category.description}</p>
              <div className="flex items-center gap-1 mt-3 text-xs text-primary-600 font-medium">
                {category.faqs.length} articles
                <ChevronRight className="w-3 h-3" />
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="space-y-6">
        {filteredCategories
          .filter(
            (c) => search || !activeCategory || c.title === activeCategory,
          )
          .map((category) => (
            <div
              key={category.title}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
                <category.icon className="w-5 h-5 text-primary-600" />
                <h2 className="font-semibold text-slate-800">
                  {category.title}
                </h2>
              </div>
              <div className="px-6">
                {category.faqs.map((faq, i) => (
                  <FAQItem key={i} faq={faq} />
                ))}
              </div>
            </div>
          ))}
      </div>

      {search && filteredCategories.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            No results found
          </h3>
          <p className="text-slate-500 mb-4">
            Try different keywords or contact our support team.
          </p>
        </div>
      )}
      <div className="bg-linear-to-br from-primary-600 to-primary-800 rounded-2xl p-8 text-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-xl font-bold mb-2">Still need help?</h2>
          <p className="text-primary-100 mb-6">
            Our support team is available Monday to Friday, 8 AM - 6 PM GMT
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            <a
              href="mailto:support@hostelhub.com"
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            >
              <Mail className="w-6 h-6" />
              <span className="text-sm font-medium">Email Support</span>
              <span className="text-xs text-primary-200">
                support@hostelhub.com
              </span>
            </a>
            <a
              href="tel:+233201234567"
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            >
              <Phone className="w-6 h-6" />
              <span className="text-sm font-medium">Call Us</span>
              <span className="text-xs text-primary-200">+233 20 123 4567</span>
            </a>
            <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
              <MessageCircle className="w-6 h-6" />
              <span className="text-sm font-medium">Live Chat</span>
              <span className="text-xs text-primary-200">
                Usually replies in 5 min
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
