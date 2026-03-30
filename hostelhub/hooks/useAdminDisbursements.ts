import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { disbursementService } from "@/services/disbursement.service";
import type { DisbursementQueryParams } from "@/types/disbursement";
import { adminPaymentKeys } from "./useAdminPayments";

export const disbursementKeys = {
  all: ["admin-disbursements"] as const,
  lists: () => [...disbursementKeys.all, "list"] as const,
  list: (params?: DisbursementQueryParams) =>
    [...disbursementKeys.lists(), params] as const,
  stats: () => [...disbursementKeys.all, "stats"] as const,
};

export function useAdminDisbursements(params?: DisbursementQueryParams) {
  return useQuery({
    queryKey: disbursementKeys.list(params),
    queryFn: () => disbursementService.adminGetAllDisbursements(params),
    placeholderData: (prev) => prev,
  });
}

export function useAdminDisbursementStats() {
  return useQuery({
    queryKey: disbursementKeys.stats(),
    queryFn: () => disbursementService.adminGetDisbursementStats(),
  });
}

export function useProcessDisbursement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (disbursementId: string) =>
      disbursementService.processDisbursement(disbursementId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: disbursementKeys.all });
      queryClient.invalidateQueries({ queryKey: adminPaymentKeys.all });
    },
  });
}

export function useVerifyDisbursement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (disbursementId: string) =>
      disbursementService.verifyDisbursement(disbursementId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: disbursementKeys.all });
      queryClient.invalidateQueries({ queryKey: adminPaymentKeys.all });
    },
  });
}

export function useMarkDisbursementComplete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      disbursementId,
      notes,
    }: {
      disbursementId: string;
      notes?: string;
    }) => disbursementService.markDisbursementComplete(disbursementId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: disbursementKeys.all });
      queryClient.invalidateQueries({ queryKey: adminPaymentKeys.all });
    },
  });
}
