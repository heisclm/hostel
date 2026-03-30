/* eslint-disable @typescript-eslint/no-unused-vars */

import { useState, useCallback } from "react";
import { bookingService } from "@/services/booking.service";
import type {
  Booking,
  CreateBookingPayload,
  PaymentInitiationResponse,
  PaymentVerificationResponse,
  BookingPagination,
} from "@/types/booking";
import { AxiosError } from "axios";

export function useCreateBooking() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);

  const createBooking = useCallback(async (data: CreateBookingPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await bookingService.createBooking(data);
      setBooking(response.data);
      return response;
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as AxiosError<{ message?: string }>;
        const message =
          axiosError.response?.data?.message ||
          axiosError.message ||
          "Failed to create booking";
        setError(message);
      } else {
        setError("Unexpected error occurred");
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { createBooking, booking, isLoading, error, setError };
}

export function useInitiatePayment() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentData, setPaymentData] =
    useState<PaymentInitiationResponse | null>(null);

  const initiatePayment = useCallback(
    async (bookingId: string, phone: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await bookingService.initiatePayment(bookingId, {
          phone,
        });
        setPaymentData(response.data);
        return response;
      } catch (err: unknown) {
        if (err && typeof err === "object" && "response" in err) {
          const axiosError = err as AxiosError<{ message?: string }>;
          const message =
            axiosError.response?.data?.message ||
            axiosError.message ||
            "Failed to initiate payment";
          setError(message);
        } else {
          setError("Unexpected error occurred");
        }
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return {
    initiatePayment,
    paymentData,
    isLoading,
    error,
    setError,
  };
}

export function useVerifyPayment() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PaymentVerificationResponse | null>(
    null,
  );
  const [isPolling, setIsPolling] = useState(false);

  const verifyOnce = useCallback(async (bookingId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await bookingService.verifyPayment(bookingId);
      setResult(response.data);
      return response.data;
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as AxiosError<{ message?: string }>;
        const message =
          axiosError.response?.data?.message ||
          axiosError.message ||
          "Failed to verify payment";
        setError(message);
      } else {
        setError("Unexpected error occurred");
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startPolling = useCallback(
    (
      bookingId: string,
      options?: {
        interval?: number;
        maxAttempts?: number;
        onSuccess?: (data: PaymentVerificationResponse) => void;
        onFailed?: (data: PaymentVerificationResponse) => void;
        onTimeout?: () => void;
      },
    ) => {
      const interval = options?.interval || 5000;
      const maxAttempts = options?.maxAttempts || 24;
      let attempts = 0;

      setIsPolling(true);
      setError(null);

      const poll = async () => {
        attempts++;

        try {
          const data = await verifyOnce(bookingId);

          if (
            data.paymentStatus === "SUCCESSFUL" ||
            data.paymentStatus === "FAILED"
          ) {
            setIsPolling(false);

            if (data.paymentStatus === "SUCCESSFUL") {
              options?.onSuccess?.(data);
            } else {
              options?.onFailed?.(data);
            }
            return;
          }

          if (attempts >= maxAttempts) {
            setIsPolling(false);
            options?.onTimeout?.();
            return;
          }

          setTimeout(poll, interval);
        } catch (err) {
          if (attempts >= maxAttempts) {
            setIsPolling(false);
            options?.onTimeout?.();
            return;
          }

          setTimeout(poll, interval);
        }
      };

      poll();
    },
    [verifyOnce],
  );

  const stopPolling = useCallback(() => {
    setIsPolling(false);
  }, []);

  return {
    verifyOnce,
    startPolling,
    stopPolling,
    result,
    isLoading,
    isPolling,
    error,
  };
}

export function useMyBookings(params?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pagination, setPagination] = useState<BookingPagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await bookingService.getMyBookings(params);
      setBookings(response.data);
      setPagination(response.pagination);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as AxiosError<{ message?: string }>;
        const message =
          axiosError.response?.data?.message ||
          axiosError.message ||
          "Failed to fetch booking";
        setError(message);
      } else {
        setError("Unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  return {
    bookings,
    pagination,
    isLoading,
    error,
    refetch: fetchBookings,
  };
}

export function useBookingDetail(bookingId: string | null) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBooking = useCallback(async () => {
    if (!bookingId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await bookingService.getBookingDetail(bookingId);
      setBooking(response.data);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as AxiosError<{ message?: string }>;
        const message =
          axiosError.response?.data?.message ||
          axiosError.message ||
          "Failed to fetch booking";
        setError(message);
      } else {
        setError("Unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  }, [bookingId]);

  return { booking, isLoading, error, refetch: fetchBooking };
}

export function useCancelBooking() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancelBooking = useCallback(
    async (bookingId: string, reason?: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await bookingService.cancelBooking(bookingId, reason);
        return response;
      } catch (err: unknown) {
        if (err && typeof err === "object" && "response" in err) {
          const axiosError = err as AxiosError<{ message?: string }>;
          const message =
            axiosError.response?.data?.message ||
            axiosError.message ||
            "Failed to cancel booking";
          setError(message);
        } else {
          setError("Unexpected error occurred");
        }
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { cancelBooking, isLoading, error, setError };
}
