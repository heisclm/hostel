/* eslint-disable @typescript-eslint/no-unused-vars */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  Mail,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

type VerificationStatus = "loading" | "success" | "error" | "expired";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<VerificationStatus>("loading");
  const [isResending, setIsResending] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus("error");
        return;
      }

      try {
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const isSuccess = Math.random() > 0.3;
        if (isSuccess) {
          setStatus("success");
          setEmail("john.doe@students.cug.edu.gh");
        } else {
          setStatus("expired");
        }
      } catch (err) {
        setStatus("error");
      }
    };

    verifyEmail();
  }, [token]);

  const handleResendVerification = async () => {
    setIsResending(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success("Verification email resent successfully!");
    } catch (err) {
      toast.error("Failed to resend. Please try again.");
    } finally {
      setIsResending(false);
    }
  };
  if (status === "loading") {
    return (
      <AuthLayout
        title="Verifying Email"
        subtitle="Please wait while we verify your email address"
        showBackButton={false}
      >
        <div className="flex flex-col items-center justify-center py-12">
          <Spinner size="xl" className="mb-6" />
          <p className="text-slate-500">Verifying your email address...</p>
        </div>
      </AuthLayout>
    );
  }

  if (status === "success") {
    return (
      <AuthLayout
        title="Email Verified!"
        subtitle="Your email has been successfully verified"
        showBackButton={false}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-24 h-24 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="w-12 h-12 text-secondary-600" />
          </motion.div>

          <div className="bg-slate-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-slate-500 mb-1">Verified email:</p>
            <p className="font-semibold text-slate-800">{email}</p>
          </div>

          <p className="text-slate-600 mb-8">
            Great! Your account is now fully activated. You can now access all
            features of HostelHub.
          </p>

          <Button
            size="lg"
            fullWidth
            rightIcon={<ArrowRight className="w-5 h-5" />}
            asChild
          >
            <Link href="/login">Continue to Login</Link>
          </Button>
        </motion.div>
      </AuthLayout>
    );
  }

  if (status === "expired") {
    return (
      <AuthLayout
        title="Link Expired"
        subtitle="This verification link has expired"
        showBackButton={false}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-12 h-12 text-amber-600" />
          </div>

          <p className="text-slate-600 mb-8">
            This verification link has expired. Verification links are valid for
            24 hours. Please request a new verification email.
          </p>

          <div className="space-y-3">
            <Button
              fullWidth
              onClick={handleResendVerification}
              isLoading={isResending}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Resend Verification Email
            </Button>
            <Button variant="ghost" fullWidth asChild>
              <Link href="/login">Back to Login</Link>
            </Button>
          </div>
        </motion.div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Verification Failed"
      subtitle="We couldn't verify your email address"
      showBackButton={false}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-12 h-12 text-red-600" />
        </div>

        <p className="text-slate-600 mb-8">
          We couldn&apos;t verify your email address. The link may be invalid or
          corrupted. Please try requesting a new verification email.
        </p>

        <div className="space-y-3">
          <Button
            fullWidth
            onClick={handleResendVerification}
            isLoading={isResending}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Resend Verification Email
          </Button>
          <Button variant="ghost" fullWidth asChild>
            <Link href="/login">Back to Login</Link>
          </Button>
        </div>

        <p className="mt-8 text-sm text-slate-500">
          Need help?{" "}
          <Link
            href="/contact"
            className="text-primary-600 font-medium hover:underline"
          >
            Contact Support
          </Link>
        </p>
      </motion.div>
    </AuthLayout>
  );
}
