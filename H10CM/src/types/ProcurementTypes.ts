// Procurement Management Types
export interface Sponsor {
  sponsor_id: number;
  program_id: number;
  sponsor_name: string;
  sponsor_code: string;
  organization_type?: string;
  primary_contact_name?: string;
  primary_contact_email?: string;
  primary_contact_phone?: string;
  billing_address?: string;
  tax_id?: string;
  payment_terms?: string;
  status: 'Active' | 'Inactive' | 'Suspended';
  notes?: string;
  created_by: number;
  created_date: string;
  last_modified: string;
  // Additional fields from joins
  program_name?: string;
}

export interface SponsorFund {
  fund_id: number;
  sponsor_id: number;
  fund_name: string;
  fund_code: string;
  fund_type: string;
  total_amount: number;
  allocated_amount: number;
  spent_amount: number;
  remaining_amount: number;
  effective_date: string;
  expiration_date?: string;
  funding_document_id?: number;
  approval_status: 'Pending' | 'Approved' | 'Rejected';
  approved_by?: number;
  approved_date?: string;
  status: 'Active' | 'Inactive' | 'Expired' | 'Exhausted';
  restrictions?: string;
  reporting_requirements?: string;
  notes?: string;
  created_by: number;
  created_date: string;
  last_modified: string;
  // Additional fields from joins
  sponsor_name?: string;
  sponsor_code?: string;
  program_id?: number;
  program_name?: string;
  days_until_expiration?: number;
  utilization_percentage?: number;
}

export interface TaskFundAllocation {
  allocation_id: number;
  task_id: number;
  fund_id: number;
  allocation_amount: number;
  spent_amount: number;
  remaining_amount: number;
  allocation_date: string;
  expiration_date?: string;
  status: 'Active' | 'Inactive' | 'Expired' | 'Exhausted';
  is_cross_payment: boolean;
  cross_payment_sponsor_id?: number;
  cross_payment_reference?: string;
  purpose: string;
  justification?: string;
  approval_status: 'Pending' | 'Approved' | 'Rejected';
  approved_by?: number;
  approved_date?: string;
  notes?: string;
  created_by: number;
  created_date: string;
  last_modified: string;
  // Additional fields from joins
  task_title?: string;
  task_description?: string;
  fund_name?: string;
  fund_code?: string;
  sponsor_name?: string;
  sponsor_code?: string;
  cross_payment_sponsor_name?: string;
  program_name?: string;
}

export interface OrderFundAllocation {
  allocation_id: number;
  order_id: number;
  fund_id: number;
  allocation_amount: number;
  percentage?: number;
  status: 'Active' | 'Inactive' | 'Cancelled';
  created_by: number;
  created_date: string;
  last_modified: string;
  // Additional fields from joins
  order_number?: string;
  fund_name?: string;
  fund_code?: string;
  sponsor_name?: string;
}

export interface FundingDocument {
  document_id: number;
  fund_id?: number;
  sponsor_id: number;
  document_number: string;
  document_name: string;
  document_type: string;
  document_path?: string;
  document_url?: string;
  contract_amount?: number;
  effective_date: string;
  expiration_date?: string;
  status: 'Active' | 'Inactive' | 'Expired' | 'Superseded';
  parent_document_id?: number;
  version_number?: number;
  legal_reference?: string;
  compliance_requirements?: string;
  renewal_terms?: string;
  termination_conditions?: string;
  notes?: string;
  uploaded_by: number;
  upload_date: string;
  created_date: string;
  last_modified: string;
  // Additional fields from joins
  sponsor_name?: string;
  sponsor_code?: string;
  fund_name?: string;
  fund_code?: string;
  uploaded_by_name?: string;
  days_until_expiration?: number;
  is_expiring_soon?: boolean;
  parent_document_name?: string;
  child_documents?: FundingDocument[];
}

export interface ProcurementVendor {
  vendor_id: number;
  program_id: number;
  vendor_name: string;
  vendor_code: string;
  vendor_type?: string;
  primary_contact_name?: string;
  primary_contact_email?: string;
  primary_contact_phone?: string;
  billing_address?: string;
  shipping_address?: string;
  tax_id?: string;
  payment_terms?: string;
  preferred_payment_method?: string;
  credit_limit?: number;
  performance_rating?: number;
  certification_requirements?: string;
  capabilities?: string;
  status: 'Active' | 'Inactive' | 'Suspended' | 'Blacklisted';
  notes?: string;
  created_by: number;
  created_date: string;
  last_modified: string;
  // Additional fields from joins
  program_name?: string;
}

export interface CrossPaymentAuditRecord {
  audit_id: number;
  pending_order_id: number;
  order_description: string;
  paying_sponsor_id: number;
  paying_sponsor_name: string;
  beneficiary_sponsor_id: number;
  beneficiary_sponsor_name: string;
  amount: number;
  created_by: string;
  created_date: string;
  notes: string;
}

export interface ProcurementOrder {
  procurement_order_id: number;
  pending_order_id: number;
  vendor_id: number;
  vendor_name: string;
  po_number: string;
  order_date: string;
  expected_delivery: string;
  tracking_number: string;
  carrier: string;
  status: 'Pending' | 'Ordered' | 'Shipped' | 'Received' | 'Delivered';
  received_date: string;
  received_by: string;
  total_amount: number;
  is_cross_payment: boolean;
  payment_fund_name: string;
  beneficiary_task_name: string;
}

export interface Vendor {
  vendor_id: number;
  name: string;
  contact_info: string;
  requires_quote: boolean;
  preferred_status: boolean;
  notes: string;
  created_date: string;
}

export interface NotificationRule {
  rule_id: number;
  event_type: 'order_submitted' | 'items_ready' | 'pickup_reminder' | 'fund_low' | 'fund_expiring';
  recipients: string[];
  template: string;
  timing: 'immediate' | 'daily' | 'weekly';
  enabled: boolean;
}

export interface SmartNotification {
  notification_id: number;
  recipient_id: number;
  recipient_name: string;
  notification_type: string;
  title: string;
  message: string;
  data: any;
  sent_date: string;
  read_date: string;
  status: 'Pending' | 'Sent' | 'Read';
}

export interface FundUsageSummary {
  sponsor_id: number;
  sponsor_name: string;
  total_funds: number;
  spent_amount: number;
  remaining_amount: number;
  expiring_funds: number;
  cross_payments_made: number;
  cross_payments_received: number;
  active_orders: number;
}

export interface CrossPaymentMatrix {
  paying_sponsor: string;
  beneficiary_sponsor: string;
  total_amount: number;
  order_count: number;
  last_payment_date: string;
}
