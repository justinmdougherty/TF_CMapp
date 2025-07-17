// Procurement Management API Functions
import axios from 'axios';
import type {
  Sponsor,
  SponsorFund,
  FundingDocument,
  TaskFundAllocation,
  OrderFundAllocation,
  CrossPaymentAuditRecord,
  ProcurementOrder,
  Vendor,
  NotificationRule,
  SmartNotification,
  FundUsageSummary,
  CrossPaymentMatrix,
} from '../types/ProcurementTypes';

// Create API client
const apiClient = axios.create({
  baseURL: '/api',
});

// --- Sponsor Management ---
export const fetchSponsors = async (): Promise<Sponsor[]> => {
  const { data } = await apiClient.get('/sponsors');
  return data;
};

export const createSponsor = async (sponsor: Omit<Sponsor, 'sponsor_id' | 'created_date'>): Promise<Sponsor> => {
  const { data } = await apiClient.post('/sponsors', sponsor);
  return data;
};

export const updateSponsor = async (sponsor: Sponsor): Promise<Sponsor> => {
  const { data } = await apiClient.put(`/sponsors/${sponsor.sponsor_id}`, sponsor);
  return data;
};

// --- Sponsor Fund Management ---
export const fetchSponsorFunds = async (): Promise<SponsorFund[]> => {
  const { data } = await apiClient.get('/sponsor-funds');
  return data;
};

export const createSponsorFund = async (fund: Omit<SponsorFund, 'fund_id' | 'created_date' | 'sponsor_name'>): Promise<SponsorFund> => {
  const { data } = await apiClient.post('/sponsor-funds', fund);
  return data;
};

export const updateSponsorFund = async (fund: SponsorFund): Promise<SponsorFund> => {
  const { data } = await apiClient.put(`/sponsor-funds/${fund.fund_id}`, fund);
  return data;
};

export const getFundUsageSummary = async (): Promise<FundUsageSummary[]> => {
  const { data } = await apiClient.get('/sponsor-funds/usage-summary');
  return data;
};

// --- Funding Document Management ---
export const fetchFundingDocuments = async (): Promise<FundingDocument[]> => {
  const { data } = await apiClient.get('/funding-documents');
  return data;
};

export const fetchFundingDocumentsBySponsor = async (sponsorId: number): Promise<FundingDocument[]> => {
  const { data } = await apiClient.get(`/funding-documents/sponsor/${sponsorId}`);
  return data;
};

export const fetchFundingDocumentsByFund = async (fundId: number): Promise<FundingDocument[]> => {
  const { data } = await apiClient.get(`/funding-documents/fund/${fundId}`);
  return data;
};

export const createFundingDocument = async (document: Omit<FundingDocument, 'document_id' | 'created_date' | 'upload_date' | 'sponsor_name' | 'fund_name' | 'uploaded_by_name'>): Promise<FundingDocument> => {
  const { data } = await apiClient.post('/funding-documents', document);
  return data;
};

export const updateFundingDocument = async (document: FundingDocument): Promise<FundingDocument> => {
  const { data } = await apiClient.put(`/funding-documents/${document.document_id}`, document);
  return data;
};

export const deleteFundingDocument = async (documentId: number): Promise<void> => {
  await apiClient.delete(`/funding-documents/${documentId}`);
};

export const uploadFundingDocument = async (file: File, metadata: Partial<FundingDocument>): Promise<FundingDocument> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('metadata', JSON.stringify(metadata));
  
  const { data } = await apiClient.post('/funding-documents/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};

export const downloadFundingDocument = async (documentId: number): Promise<Blob> => {
  const { data } = await apiClient.get(`/funding-documents/${documentId}/download`, {
    responseType: 'blob',
  });
  return data;
};

export const getExpiringDocuments = async (daysAhead: number = 30): Promise<FundingDocument[]> => {
  const { data } = await apiClient.get(`/funding-documents/expiring?days=${daysAhead}`);
  return data;
};

// --- Task Fund Allocation ---
export const fetchTaskFundAllocations = async (): Promise<TaskFundAllocation[]> => {
  const { data } = await apiClient.get('/task-fund-allocations');
  return data;
};

export const createTaskFundAllocation = async (allocation: Omit<TaskFundAllocation, 'allocation_id' | 'created_date' | 'remaining_amount' | 'task_name' | 'beneficiary_sponsor_name' | 'paying_sponsor_name'>): Promise<TaskFundAllocation> => {
  const { data } = await apiClient.post('/task-fund-allocations', allocation);
  return data;
};

export const updateTaskFundAllocation = async (allocation: TaskFundAllocation): Promise<TaskFundAllocation> => {
  const { data } = await apiClient.put(`/task-fund-allocations/${allocation.allocation_id}`, allocation);
  return data;
};

// --- Order Fund Allocation ---
export const fetchOrderFundAllocations = async (): Promise<OrderFundAllocation[]> => {
  const { data } = await apiClient.get('/order-fund-allocations');
  return data;
};

export const createOrderFundAllocation = async (allocation: {
  pending_order_id: number;
  fund_id: number;
  task_id: number;
  amount: number;
  notes?: string;
}): Promise<OrderFundAllocation> => {
  const { data } = await apiClient.post('/order-fund-allocations', allocation);
  return data;
};

// --- Cross Payment Audit ---
export const fetchCrossPaymentAudit = async (): Promise<CrossPaymentAuditRecord[]> => {
  const { data } = await apiClient.get('/cross-payment-audit');
  return data;
};

export const getCrossPaymentMatrix = async (): Promise<CrossPaymentMatrix[]> => {
  const { data } = await apiClient.get('/cross-payment-matrix');
  return data;
};

// --- Procurement Orders ---
export const fetchProcurementOrders = async (): Promise<ProcurementOrder[]> => {
  const { data } = await apiClient.get('/procurement-orders');
  return data;
};

export const createProcurementOrder = async (order: Omit<ProcurementOrder, 'procurement_order_id' | 'order_date' | 'received_date' | 'received_by'>): Promise<ProcurementOrder> => {
  const { data } = await apiClient.post('/procurement-orders', order);
  return data;
};

export const updateProcurementOrder = async (order: ProcurementOrder): Promise<ProcurementOrder> => {
  const { data } = await apiClient.put(`/procurement-orders/${order.procurement_order_id}`, order);
  return data;
};

export const markOrderReceived = async (procurementOrderId: number, receivedBy: string): Promise<ProcurementOrder> => {
  const { data } = await apiClient.put(`/procurement-orders/${procurementOrderId}/received`, { received_by: receivedBy });
  return data;
};

// --- Vendor Management ---
export const fetchVendors = async (): Promise<Vendor[]> => {
  const { data } = await apiClient.get('/vendors');
  return data;
};

export const createVendor = async (vendor: Omit<Vendor, 'vendor_id' | 'created_date'>): Promise<Vendor> => {
  const { data } = await apiClient.post('/vendors', vendor);
  return data;
};

export const updateVendor = async (vendor: Vendor): Promise<Vendor> => {
  const { data } = await apiClient.put(`/vendors/${vendor.vendor_id}`, vendor);
  return data;
};

// --- Smart Notifications ---
export const fetchNotifications = async (userId: number): Promise<SmartNotification[]> => {
  const { data } = await apiClient.get(`/notifications/user/${userId}`);
  return data;
};

export const markNotificationRead = async (notificationId: number): Promise<void> => {
  await apiClient.put(`/notifications/${notificationId}/read`);
};

export const fetchNotificationRules = async (): Promise<NotificationRule[]> => {
  const { data } = await apiClient.get('/notification-rules');
  return data;
};

export const updateNotificationRule = async (rule: NotificationRule): Promise<NotificationRule> => {
  const { data } = await apiClient.put(`/notification-rules/${rule.rule_id}`, rule);
  return data;
};

// --- Reporting ---
export const generateFundUsageReport = async (startDate: string, endDate: string): Promise<any> => {
  const { data } = await apiClient.get('/reports/fund-usage', { params: { start_date: startDate, end_date: endDate } });
  return data;
};

export const generateCrossPaymentReport = async (startDate: string, endDate: string): Promise<any> => {
  const { data } = await apiClient.get('/reports/cross-payments', { params: { start_date: startDate, end_date: endDate } });
  return data;
};

export const generateAuditTrailReport = async (startDate: string, endDate: string): Promise<any> => {
  const { data } = await apiClient.get('/reports/audit-trail', { params: { start_date: startDate, end_date: endDate } });
  return data;
};
