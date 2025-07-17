// React Query hooks for Procurement Management
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchSponsors,
  createSponsor,
  updateSponsor,
  fetchSponsorFunds,
  createSponsorFund,
  updateSponsorFund,
  getFundUsageSummary,
  fetchFundingDocuments,
  fetchFundingDocumentsBySponsor,
  fetchFundingDocumentsByFund,
  createFundingDocument,
  updateFundingDocument,
  deleteFundingDocument,
  uploadFundingDocument,
  downloadFundingDocument,
  getExpiringDocuments,
  fetchTaskFundAllocations,
  createTaskFundAllocation,
  updateTaskFundAllocation,
  fetchOrderFundAllocations,
  createOrderFundAllocation,
  fetchCrossPaymentAudit,
  getCrossPaymentMatrix,
  fetchProcurementOrders,
  createProcurementOrder,
  updateProcurementOrder,
  markOrderReceived,
  fetchVendors,
  createVendor,
  updateVendor,
  fetchNotifications,
  markNotificationRead,
  fetchNotificationRules,
  updateNotificationRule,
  generateFundUsageReport,
  generateCrossPaymentReport,
  generateAuditTrailReport,
} from '../../services/procurementApi.js';
import type { Sponsor } from '../../types/ProcurementTypes';

// --- Sponsor Hooks ---
export const useSponsors = () => {
  return useQuery({
    queryKey: ['sponsors'],
    queryFn: fetchSponsors,
    refetchOnWindowFocus: false,
  });
};

export const useCreateSponsor = () => {
  const queryClient = useQueryClient();
  return useMutation<Sponsor, Error, Omit<Sponsor, 'sponsor_id' | 'created_date'>>({
    mutationFn: createSponsor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sponsors'] });
    },
  });
};

export const useUpdateSponsor = () => {
  const queryClient = useQueryClient();
  return useMutation<Sponsor, Error, Sponsor>({
    mutationFn: updateSponsor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sponsors'] });
    },
  });
};

// --- Sponsor Fund Hooks ---
export const useSponsorFunds = () => {
  return useQuery({
    queryKey: ['sponsor-funds'],
    queryFn: fetchSponsorFunds,
    refetchOnWindowFocus: false,
  });
};

export const useCreateSponsorFund = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSponsorFund,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sponsor-funds'] });
      queryClient.invalidateQueries({ queryKey: ['fund-usage-summary'] });
    },
  });
};

export const useUpdateSponsorFund = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateSponsorFund,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sponsor-funds'] });
      queryClient.invalidateQueries({ queryKey: ['fund-usage-summary'] });
    },
  });
};

export const useFundUsageSummary = () => {
  return useQuery({
    queryKey: ['fund-usage-summary'],
    queryFn: getFundUsageSummary,
    refetchOnWindowFocus: false,
  });
};

// --- Funding Document Hooks ---
export const useFundingDocuments = () => {
  return useQuery({
    queryKey: ['funding-documents'],
    queryFn: fetchFundingDocuments,
    refetchOnWindowFocus: false,
  });
};

export const useFundingDocumentsBySponsor = (sponsorId: number) => {
  return useQuery({
    queryKey: ['funding-documents', 'sponsor', sponsorId],
    queryFn: () => fetchFundingDocumentsBySponsor(sponsorId),
    refetchOnWindowFocus: false,
    enabled: !!sponsorId,
  });
};

export const useFundingDocumentsByFund = (fundId: number) => {
  return useQuery({
    queryKey: ['funding-documents', 'fund', fundId],
    queryFn: () => fetchFundingDocumentsByFund(fundId),
    refetchOnWindowFocus: false,
    enabled: !!fundId,
  });
};

export const useCreateFundingDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createFundingDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funding-documents'] });
      queryClient.invalidateQueries({ queryKey: ['sponsor-funds'] });
    },
  });
};

export const useUpdateFundingDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateFundingDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funding-documents'] });
      queryClient.invalidateQueries({ queryKey: ['sponsor-funds'] });
    },
  });
};

export const useDeleteFundingDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteFundingDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funding-documents'] });
      queryClient.invalidateQueries({ queryKey: ['sponsor-funds'] });
    },
  });
};

export const useUploadFundingDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, metadata }: { file: File; metadata: Partial<import('../../types/ProcurementTypes').FundingDocument> }) =>
      uploadFundingDocument(file, metadata),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funding-documents'] });
      queryClient.invalidateQueries({ queryKey: ['sponsor-funds'] });
    },
  });
};

export const useDownloadFundingDocument = () => {
  return useMutation({
    mutationFn: downloadFundingDocument,
  });
};

export const useExpiringDocuments = (daysAhead: number = 30) => {
  return useQuery({
    queryKey: ['funding-documents', 'expiring', daysAhead],
    queryFn: () => getExpiringDocuments(daysAhead),
    refetchOnWindowFocus: false,
  });
};

// --- Task Fund Allocation Hooks ---
export const useTaskFundAllocations = () => {
  return useQuery({
    queryKey: ['task-fund-allocations'],
    queryFn: fetchTaskFundAllocations,
    refetchOnWindowFocus: false,
  });
};

export const useCreateTaskFundAllocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTaskFundAllocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-fund-allocations'] });
      queryClient.invalidateQueries({ queryKey: ['sponsor-funds'] });
      queryClient.invalidateQueries({ queryKey: ['fund-usage-summary'] });
    },
  });
};

export const useUpdateTaskFundAllocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTaskFundAllocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-fund-allocations'] });
      queryClient.invalidateQueries({ queryKey: ['sponsor-funds'] });
      queryClient.invalidateQueries({ queryKey: ['fund-usage-summary'] });
    },
  });
};

// --- Order Fund Allocation Hooks ---
export const useOrderFundAllocations = () => {
  return useQuery({
    queryKey: ['order-fund-allocations'],
    queryFn: fetchOrderFundAllocations,
    refetchOnWindowFocus: false,
  });
};

export const useCreateOrderFundAllocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOrderFundAllocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-fund-allocations'] });
      queryClient.invalidateQueries({ queryKey: ['cross-payment-audit'] });
      queryClient.invalidateQueries({ queryKey: ['procurement-orders'] });
    },
  });
};

// --- Cross Payment Audit Hooks ---
export const useCrossPaymentAudit = () => {
  return useQuery({
    queryKey: ['cross-payment-audit'],
    queryFn: fetchCrossPaymentAudit,
    refetchOnWindowFocus: false,
  });
};

export const useCrossPaymentMatrix = () => {
  return useQuery({
    queryKey: ['cross-payment-matrix'],
    queryFn: getCrossPaymentMatrix,
    refetchOnWindowFocus: false,
  });
};

// --- Procurement Order Hooks ---
export const useProcurementOrders = () => {
  return useQuery({
    queryKey: ['procurement-orders'],
    queryFn: fetchProcurementOrders,
    refetchOnWindowFocus: false,
  });
};

export const useCreateProcurementOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProcurementOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procurement-orders'] });
      queryClient.invalidateQueries({ queryKey: ['pending-orders'] });
    },
  });
};

export const useUpdateProcurementOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProcurementOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procurement-orders'] });
    },
  });
};

export const useMarkOrderReceived = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ procurementOrderId, receivedBy }: { procurementOrderId: number; receivedBy: string }) =>
      markOrderReceived(procurementOrderId, receivedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procurement-orders'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

// --- Vendor Hooks ---
export const useVendors = () => {
  return useQuery({
    queryKey: ['vendors'],
    queryFn: fetchVendors,
    refetchOnWindowFocus: false,
  });
};

export const useCreateVendor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createVendor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
    },
  });
};

export const useUpdateVendor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateVendor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
    },
  });
};

// --- Notification Hooks ---
export const useNotifications = (userId: number) => {
  return useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => fetchNotifications(userId),
    refetchOnWindowFocus: false,
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useNotificationRules = () => {
  return useQuery({
    queryKey: ['notification-rules'],
    queryFn: fetchNotificationRules,
    refetchOnWindowFocus: false,
  });
};

export const useUpdateNotificationRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateNotificationRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-rules'] });
    },
  });
};

// --- Reporting Hooks ---
export const useGenerateFundUsageReport = () => {
  return useMutation({
    mutationFn: ({ startDate, endDate }: { startDate: string; endDate: string }) =>
      generateFundUsageReport(startDate, endDate),
  });
};

export const useGenerateCrossPaymentReport = () => {
  return useMutation({
    mutationFn: ({ startDate, endDate }: { startDate: string; endDate: string }) =>
      generateCrossPaymentReport(startDate, endDate),
  });
};

export const useGenerateAuditTrailReport = () => {
  return useMutation({
    mutationFn: ({ startDate, endDate }: { startDate: string; endDate: string }) =>
      generateAuditTrailReport(startDate, endDate),
  });
};
