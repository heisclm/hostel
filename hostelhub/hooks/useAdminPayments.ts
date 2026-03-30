
import { useQuery } from "@tanstack/react-query";
import { paymentService } from "@/services/payment.service";
import type { AdminPaymentQueryParams } from "@/types/payment";

export const adminPaymentKeys = {
  all: ["admin-payments"] as const,
  lists: () => [...adminPaymentKeys.all, "list"] as const,
  list: (params?: AdminPaymentQueryParams) =>
    [...adminPaymentKeys.lists(), params] as const,
  stats: () => [...adminPaymentKeys.all, "stats"] as const,
  detail: (id: string) => [...adminPaymentKeys.all, "detail", id] as const,
};

export function useAdminPayments(params?: AdminPaymentQueryParams) {
  return useQuery({
    queryKey: adminPaymentKeys.list(params),
    queryFn: () => paymentService.adminGetAllPayments(params),
    placeholderData: (prev) => prev,
  });
}

export function useAdminPaymentStats() {
  return useQuery({
    queryKey: adminPaymentKeys.stats(),
    queryFn: () => paymentService.adminGetPaymentStats(),
  });
}

export function useAdminPaymentDetail(paymentId: string) {
  return useQuery({
    queryKey: adminPaymentKeys.detail(paymentId),
    queryFn: () => paymentService.adminGetPaymentDetail(paymentId),
    enabled: !!paymentId,
  });
}