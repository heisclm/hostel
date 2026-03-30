"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote, Star, Loader2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import { reviewService } from "@/services/review.service";
import type { Review } from "@/types/review";

interface Testimonial {
  id: string;
  name: string;
  role: string;
  rating: number;
  content: string;
  hostel: string;
  avatar?: string | null;
}

function transformReviewToTestimonial(review: Review): Testimonial {
  const userName = review.user
    ? `${review.user.firstName} ${review.user.lastName}`
    : "Anonymous User";

  let userRole = "Resident";
  if (review.user?.role === "STUDENT") {
    userRole = "CUG Student";
  } else if (review.user?.role === "GUEST") {
    userRole = "Guest";
  }

  return {
    id: review.id,
    name: userName,
    role: userRole,
    rating: review.rating,
    content: review.comment || "Great experience staying at this hostel!",
    hostel: review.hostel?.name || "HostelHub Hostel",
    avatar: null,
  };
}

export function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setIsLoading(true);
        const response = await reviewService.getFeaturedReviews(10);

        if (response.success && response.data.length > 0) {
          const reviewsWithComments = response.data.filter(
            (review) => review.comment && review.comment.trim().length > 20,
          );

          if (reviewsWithComments.length > 0) {
            const transformed = reviewsWithComments.map(
              transformReviewToTestimonial,
            );
            setTestimonials(transformed);
          } else {
            const transformed = response.data.map(transformReviewToTestimonial);
            setTestimonials(transformed);
          }
        } else {
          setTestimonials([]);
        }
      } catch (error) {
        console.error("Failed to fetch reviews:", error);

        setTestimonials([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  const paginate = useCallback(
    (newDirection: number) => {
      if (testimonials.length === 0) return;

      setDirection(newDirection);
      setCurrentIndex((prev) => {
        if (newDirection === 1) {
          return prev === testimonials.length - 1 ? 0 : prev + 1;
        }
        return prev === 0 ? testimonials.length - 1 : prev - 1;
      });
    },
    [testimonials.length],
  );

  useEffect(() => {
    if (!isAutoPlaying || testimonials.length === 0) return;

    const timer = setInterval(() => {
      paginate(1);
    }, 5000);

    return () => clearInterval(timer);
  }, [isAutoPlaying, paginate, testimonials.length]);

  const currentTestimonial = testimonials[currentIndex];

  if (isLoading) {
    return (
      <section className="py-20 lg:py-28 bg-linear-to-br from-primary-900 via-primary-800 to-slate-900 overflow-hidden">
        <div className="container-custom">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-white/10 text-white/90 rounded-full text-sm font-semibold mb-4">
              Student Reviews
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              What CUG Students Say About{" "}
              <span className="text-secondary-400">their hostels</span>
            </h2>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              Join hundreds of CUG students who found their perfect hostel
              through our platform.
            </p>
          </div>

          <div className="flex justify-center items-center h-80">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 text-white animate-spin" />
              <p className="text-white/70">Loading reviews...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (testimonials.length === 0) {
    return null;
  }

  return (
    <section className="py-20 lg:py-28 bg-linear-to-br from-primary-900 via-primary-800 to-slate-900 overflow-hidden">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 bg-white/10 text-white/90 rounded-full text-sm font-semibold mb-4">
            Student Reviews
          </span>
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            What CUG Students Say About{" "}
            <span className="text-secondary-400">their hostels</span>
          </h2>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            Join hundreds of CUG students who found their perfect hostel through
            our platform.
          </p>
        </motion.div>

        <div
          className="relative max-w-4xl mx-auto"
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
        >
          <div className="relative h-105 sm:h-80">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              {currentTestimonial && (
                <motion.div
                  key={currentIndex}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 },
                  }}
                  className="absolute inset-0"
                >
                  <div className="bg-white rounded-3xl p-8 sm:p-10 h-full shadow-xl">
                    <div className="absolute -top-4 left-10 w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Quote className="w-6 h-6 text-white" />
                    </div>

                    <div className="flex items-center gap-1 mb-6 pt-4">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "w-5 h-5",
                            i < currentTestimonial.rating
                              ? "text-amber-500 fill-amber-500"
                              : "text-slate-200",
                          )}
                        />
                      ))}
                      <span className="ml-2 text-sm font-medium text-slate-500">
                        {currentTestimonial.rating}.0
                      </span>
                    </div>

                    <blockquote className="text-slate-700 text-lg leading-relaxed mb-8 line-clamp-4">
                      &quot;{currentTestimonial.content}&quot;
                    </blockquote>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar
                          name={currentTestimonial.name}
                          src={currentTestimonial.avatar}
                          size="lg"
                        />
                        <div>
                          <p className="font-semibold text-slate-800">
                            {currentTestimonial.name}
                          </p>
                          <p className="text-sm text-slate-500">
                            {currentTestimonial.role}
                          </p>
                        </div>
                      </div>
                      <div className="hidden sm:block text-right">
                        <p className="text-xs text-slate-400">Stayed at</p>
                        <p className="text-sm font-medium text-primary-600">
                          {currentTestimonial.hostel}
                        </p>
                      </div>
                    </div>

                    <div className="sm:hidden mt-4 pt-4 border-t border-slate-100">
                      <p className="text-xs text-slate-400">Stayed at</p>
                      <p className="text-sm font-medium text-primary-600">
                        {currentTestimonial.hostel}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {testimonials.length > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={() => paginate(-1)}
                className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <div className="flex items-center gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setDirection(index > currentIndex ? 1 : -1);
                      setCurrentIndex(index);
                    }}
                    className={cn(
                      "h-2 rounded-full transition-all duration-300",
                      index === currentIndex
                        ? "w-8 bg-secondary-400"
                        : "w-2 bg-white/30 hover:bg-white/50",
                    )}
                    aria-label={`Go to testimonial ${index + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={() => paginate(1)}
                className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                aria-label="Next testimonial"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          )}

          <div className="text-center mt-6">
            <p className="text-sm text-white/50">
              {testimonials.length === 1
                ? "Showing 1 verified review from a real student"
                : `Showing ${testimonials.length} verified reviews from real students`}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
