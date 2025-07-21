-- ==============================================================================
-- 05_PROCUREMENT_TABLES.SQL - H10CM PROCUREMENT AND VENDOR MANAGEMENT TABLES
-- ==============================================================================
-- This module creates the procurement, vendor management, sponsor funding,
-- and cross-payment audit tables for comprehensive financial tracking.
-- 
-- DEPENDENCIES: 04_inventory_tables.sql
-- CREATES: Vendors, sponsors, funding, and financial audit tables
--
-- Author: H10CM Development Team
-- Created: 2025-07-20
-- Version: H10CM v2.1 Modular
-- ==============================================================================

USE H10CM;
GO

PRINT 'Creating procurement and vendor management tables...';

-- =============================================
-- VENDOR MANAGEMENT TABLES
-- =============================================

-- ProcurementVendors Table (Program-isolated vendor management)
CREATE TABLE [dbo].[ProcurementVendors](
    [vendor_id] [int] IDENTITY(1,1) NOT NULL,
    [program_id] [int] NOT NULL, -- Multi-tenant isolation
    [vendor_name] [nvarchar](255) NOT NULL,
    [vendor_code] [nvarchar](50) NOT NULL,
    [vendor_type] [nvarchar](100) NULL,
    [primary_contact_name] [nvarchar](255) NULL,
    [primary_contact_email] [nvarchar](255) NULL,
    [primary_contact_phone] [nvarchar](50) NULL,
    [billing_address] [nvarchar](max) NULL,
    [shipping_address] [nvarchar](max) NULL,
    [tax_id] [nvarchar](50) NULL,
    [payment_terms] [nvarchar](255) NULL,
    [preferred_payment_method] [nvarchar](100) NULL,
    [credit_limit] [decimal](18,2) NULL,
    [performance_rating] [decimal](3,2) NULL,
    [certification_requirements] [nvarchar](max) NULL,
    [capabilities] [nvarchar](max) NULL,
    [status] [nvarchar](20) NOT NULL DEFAULT 'Active',
    [notes] [nvarchar](max) NULL,
    [created_by] [int] NOT NULL,
    [created_date] [datetime2] NOT NULL DEFAULT GETDATE(),
    [last_modified] [datetime2] NOT NULL DEFAULT GETDATE(),
    CONSTRAINT [PK_ProcurementVendors] PRIMARY KEY CLUSTERED ([vendor_id]),
    CONSTRAINT [UQ_ProcurementVendors_Code] UNIQUE ([program_id], [vendor_code]),
    CONSTRAINT [CK_ProcurementVendors_Status] CHECK ([status] IN ('Active', 'Inactive', 'Suspended', 'Blacklisted')),
    CONSTRAINT [CK_ProcurementVendors_Rating] CHECK ([performance_rating] >= 0 AND [performance_rating] <= 5)
) ON [PRIMARY];
GO

-- =============================================
-- SPONSOR AND FUNDING MANAGEMENT TABLES
-- =============================================

-- Sponsors Table (Funding source management)
CREATE TABLE [dbo].[Sponsors](
    [sponsor_id] [int] IDENTITY(1,1) NOT NULL,
    [program_id] [int] NOT NULL,
    [sponsor_name] [nvarchar](255) NOT NULL,
    [sponsor_code] [nvarchar](50) NOT NULL,
    [organization_type] [nvarchar](100) NULL,
    [primary_contact_name] [nvarchar](255) NULL,
    [primary_contact_email] [nvarchar](255) NULL,
    [primary_contact_phone] [nvarchar](50) NULL,
    [billing_address] [nvarchar](max) NULL,
    [tax_id] [nvarchar](50) NULL,
    [payment_terms] [nvarchar](255) NULL,
    [status] [nvarchar](20) NOT NULL DEFAULT 'Active',
    [notes] [nvarchar](max) NULL,
    [created_by] [int] NOT NULL,
    [created_date] [datetime2] NOT NULL DEFAULT GETDATE(),
    [last_modified] [datetime2] NOT NULL DEFAULT GETDATE(),
    CONSTRAINT [PK_Sponsors] PRIMARY KEY CLUSTERED ([sponsor_id]),
    CONSTRAINT [UQ_Sponsors_Code] UNIQUE ([program_id], [sponsor_code]),
    CONSTRAINT [CK_Sponsors_Status] CHECK ([status] IN ('Active', 'Inactive', 'Suspended'))
) ON [PRIMARY];
GO

-- SponsorFunds Table (Individual funding streams)
CREATE TABLE [dbo].[SponsorFunds](
    [fund_id] [int] IDENTITY(1,1) NOT NULL,
    [sponsor_id] [int] NOT NULL,
    [fund_name] [nvarchar](255) NOT NULL,
    [fund_code] [nvarchar](50) NOT NULL,
    [fund_type] [nvarchar](100) NOT NULL,
    [total_amount] [decimal](18,2) NOT NULL,
    [allocated_amount] [decimal](18,2) NOT NULL DEFAULT 0,
    [spent_amount] [decimal](18,2) NOT NULL DEFAULT 0,
    [remaining_amount] [decimal](18,2) NOT NULL DEFAULT 0,
    [effective_date] [date] NOT NULL,
    [expiration_date] [date] NULL,
    [funding_document_id] [int] NULL,
    [approval_status] [nvarchar](20) NOT NULL DEFAULT 'Pending',
    [approved_by] [int] NULL,
    [approved_date] [datetime2] NULL,
    [status] [nvarchar](20) NOT NULL DEFAULT 'Active',
    [restrictions] [nvarchar](max) NULL,
    [reporting_requirements] [nvarchar](max) NULL,
    [notes] [nvarchar](max) NULL,
    [created_by] [int] NOT NULL,
    [created_date] [datetime2] NOT NULL DEFAULT GETDATE(),
    [last_modified] [datetime2] NOT NULL DEFAULT GETDATE(),
    CONSTRAINT [PK_SponsorFunds] PRIMARY KEY CLUSTERED ([fund_id]),
    CONSTRAINT [UQ_SponsorFunds_Code] UNIQUE ([sponsor_id], [fund_code]),
    CONSTRAINT [CK_SponsorFunds_ApprovalStatus] CHECK ([approval_status] IN ('Pending', 'Approved', 'Rejected')),
    CONSTRAINT [CK_SponsorFunds_Status] CHECK ([status] IN ('Active', 'Inactive', 'Expired', 'Exhausted')),
    CONSTRAINT [CK_SponsorFunds_Amounts] CHECK ([total_amount] >= 0 AND [allocated_amount] >= 0 AND [spent_amount] >= 0)
) ON [PRIMARY];
GO

-- FundingDocuments Table (Contract and agreement tracking)
CREATE TABLE [dbo].[FundingDocuments](
    [document_id] [int] IDENTITY(1,1) NOT NULL,
    [fund_id] [int] NULL,
    [sponsor_id] [int] NOT NULL,
    [document_number] [nvarchar](100) NOT NULL,
    [document_name] [nvarchar](255) NOT NULL,
    [document_type] [nvarchar](100) NOT NULL,
    [document_path] [nvarchar](500) NULL,
    [document_url] [nvarchar](500) NULL,
    [contract_amount] [decimal](18,2) NULL,
    [effective_date] [date] NOT NULL,
    [expiration_date] [date] NULL,
    [status] [nvarchar](20) NOT NULL DEFAULT 'Active',
    [parent_document_id] [int] NULL,
    [version_number] [int] NULL DEFAULT 1,
    [legal_reference] [nvarchar](255) NULL,
    [compliance_requirements] [nvarchar](max) NULL,
    [renewal_terms] [nvarchar](max) NULL,
    [termination_conditions] [nvarchar](max) NULL,
    [notes] [nvarchar](max) NULL,
    [uploaded_by] [int] NOT NULL,
    [upload_date] [datetime2] NOT NULL DEFAULT GETDATE(),
    [created_date] [datetime2] NOT NULL DEFAULT GETDATE(),
    [last_modified] [datetime2] NOT NULL DEFAULT GETDATE(),
    CONSTRAINT [PK_FundingDocuments] PRIMARY KEY CLUSTERED ([document_id]),
    CONSTRAINT [UQ_FundingDocuments_Number] UNIQUE ([sponsor_id], [document_number]),
    CONSTRAINT [CK_FundingDocuments_Status] CHECK ([status] IN ('Active', 'Inactive', 'Expired', 'Superseded'))
) ON [PRIMARY];
GO

-- =============================================
-- FUND ALLOCATION AND TRACKING TABLES
-- =============================================

-- TaskFundAllocations Table (Track fund allocations to tasks)
CREATE TABLE [dbo].[TaskFundAllocations](
    [allocation_id] [int] IDENTITY(1,1) NOT NULL,
    [task_id] [int] NOT NULL,
    [fund_id] [int] NOT NULL,
    [allocation_amount] [decimal](18,2) NOT NULL,
    [spent_amount] [decimal](18,2) NOT NULL DEFAULT 0,
    [remaining_amount] [decimal](18,2) NOT NULL DEFAULT 0,
    [allocation_date] [datetime2] NOT NULL DEFAULT GETDATE(),
    [expiration_date] [datetime2] NULL,
    [status] [nvarchar](20) NOT NULL DEFAULT 'Active',
    [is_cross_payment] [bit] NOT NULL DEFAULT 0,
    [cross_payment_sponsor_id] [int] NULL,
    [cross_payment_reference] [nvarchar](255) NULL,
    [purpose] [nvarchar](255) NOT NULL,
    [justification] [nvarchar](max) NULL,
    [approval_status] [nvarchar](20) NOT NULL DEFAULT 'Pending',
    [approved_by] [int] NULL,
    [approved_date] [datetime2] NULL,
    [notes] [nvarchar](max) NULL,
    [created_by] [int] NOT NULL,
    [created_date] [datetime2] NOT NULL DEFAULT GETDATE(),
    [last_modified] [datetime2] NOT NULL DEFAULT GETDATE(),
    CONSTRAINT [PK_TaskFundAllocations] PRIMARY KEY CLUSTERED ([allocation_id]),
    CONSTRAINT [CK_TaskFundAllocations_Status] CHECK ([status] IN ('Active', 'Inactive', 'Expired', 'Exhausted')),
    CONSTRAINT [CK_TaskFundAllocations_ApprovalStatus] CHECK ([approval_status] IN ('Pending', 'Approved', 'Rejected')),
    CONSTRAINT [CK_TaskFundAllocations_Amounts] CHECK ([allocation_amount] >= 0 AND [spent_amount] >= 0)
) ON [PRIMARY];
GO

-- OrderFundAllocations Table (Track fund allocations to orders)
CREATE TABLE [dbo].[OrderFundAllocations](
    [allocation_id] [int] IDENTITY(1,1) NOT NULL,
    [order_id] [int] NOT NULL,
    [fund_id] [int] NOT NULL,
    [allocation_amount] [decimal](18,2) NOT NULL,
    [percentage] [decimal](5,2) NULL,
    [status] [nvarchar](20) NOT NULL DEFAULT 'Active',
    [created_by] [int] NOT NULL,
    [created_date] [datetime2] NOT NULL DEFAULT GETDATE(),
    [last_modified] [datetime2] NOT NULL DEFAULT GETDATE(),
    CONSTRAINT [PK_OrderFundAllocations] PRIMARY KEY CLUSTERED ([allocation_id]),
    CONSTRAINT [CK_OrderFundAllocations_Status] CHECK ([status] IN ('Active', 'Inactive', 'Cancelled')),
    CONSTRAINT [CK_OrderFundAllocations_Amount] CHECK ([allocation_amount] >= 0),
    CONSTRAINT [CK_OrderFundAllocations_Percentage] CHECK ([percentage] >= 0 AND [percentage] <= 100)
) ON [PRIMARY];
GO

-- CrossPaymentAudit Table (Track cross-sponsor payments)
CREATE TABLE [dbo].[CrossPaymentAudit](
    [audit_id] [int] IDENTITY(1,1) NOT NULL,
    [pending_order_id] [int] NOT NULL,
    [order_description] [nvarchar](255) NOT NULL,
    [paying_sponsor_id] [int] NOT NULL,
    [beneficiary_sponsor_id] [int] NOT NULL,
    [amount] [decimal](18,2) NOT NULL,
    [created_by] [int] NOT NULL,
    [created_date] [datetime2] NOT NULL DEFAULT GETDATE(),
    [notes] [nvarchar](max) NULL,
    CONSTRAINT [PK_CrossPaymentAudit] PRIMARY KEY CLUSTERED ([audit_id])
) ON [PRIMARY];
GO

-- Add foreign key constraints for procurement tables
ALTER TABLE [dbo].[ProcurementVendors] ADD CONSTRAINT [FK_ProcurementVendors_Programs] 
    FOREIGN KEY([program_id]) REFERENCES [dbo].[Programs] ([program_id]);

ALTER TABLE [dbo].[ProcurementVendors] ADD CONSTRAINT [FK_ProcurementVendors_CreatedBy] 
    FOREIGN KEY([created_by]) REFERENCES [dbo].[Users] ([user_id]);

ALTER TABLE [dbo].[Sponsors] ADD CONSTRAINT [FK_Sponsors_Programs] 
    FOREIGN KEY([program_id]) REFERENCES [dbo].[Programs] ([program_id]);

ALTER TABLE [dbo].[Sponsors] ADD CONSTRAINT [FK_Sponsors_CreatedBy] 
    FOREIGN KEY([created_by]) REFERENCES [dbo].[Users] ([user_id]);

ALTER TABLE [dbo].[SponsorFunds] ADD CONSTRAINT [FK_SponsorFunds_Sponsors] 
    FOREIGN KEY([sponsor_id]) REFERENCES [dbo].[Sponsors] ([sponsor_id]);

ALTER TABLE [dbo].[SponsorFunds] ADD CONSTRAINT [FK_SponsorFunds_CreatedBy] 
    FOREIGN KEY([created_by]) REFERENCES [dbo].[Users] ([user_id]);

ALTER TABLE [dbo].[SponsorFunds] ADD CONSTRAINT [FK_SponsorFunds_ApprovedBy] 
    FOREIGN KEY([approved_by]) REFERENCES [dbo].[Users] ([user_id]);

ALTER TABLE [dbo].[FundingDocuments] ADD CONSTRAINT [FK_FundingDocuments_Funds] 
    FOREIGN KEY([fund_id]) REFERENCES [dbo].[SponsorFunds] ([fund_id]);

ALTER TABLE [dbo].[FundingDocuments] ADD CONSTRAINT [FK_FundingDocuments_Sponsors] 
    FOREIGN KEY([sponsor_id]) REFERENCES [dbo].[Sponsors] ([sponsor_id]);

ALTER TABLE [dbo].[FundingDocuments] ADD CONSTRAINT [FK_FundingDocuments_Parent] 
    FOREIGN KEY([parent_document_id]) REFERENCES [dbo].[FundingDocuments] ([document_id]);

ALTER TABLE [dbo].[FundingDocuments] ADD CONSTRAINT [FK_FundingDocuments_UploadedBy] 
    FOREIGN KEY([uploaded_by]) REFERENCES [dbo].[Users] ([user_id]);

-- Add the circular reference for SponsorFunds -> FundingDocuments
ALTER TABLE [dbo].[SponsorFunds] ADD CONSTRAINT [FK_SponsorFunds_FundingDocuments] 
    FOREIGN KEY([funding_document_id]) REFERENCES [dbo].[FundingDocuments] ([document_id]);

ALTER TABLE [dbo].[TaskFundAllocations] ADD CONSTRAINT [FK_TaskFundAllocations_Tasks] 
    FOREIGN KEY([task_id]) REFERENCES [dbo].[Tasks] ([task_id]);

ALTER TABLE [dbo].[TaskFundAllocations] ADD CONSTRAINT [FK_TaskFundAllocations_Funds] 
    FOREIGN KEY([fund_id]) REFERENCES [dbo].[SponsorFunds] ([fund_id]);

ALTER TABLE [dbo].[TaskFundAllocations] ADD CONSTRAINT [FK_TaskFundAllocations_CrossPaymentSponsors] 
    FOREIGN KEY([cross_payment_sponsor_id]) REFERENCES [dbo].[Sponsors] ([sponsor_id]);

ALTER TABLE [dbo].[TaskFundAllocations] ADD CONSTRAINT [FK_TaskFundAllocations_CreatedBy] 
    FOREIGN KEY([created_by]) REFERENCES [dbo].[Users] ([user_id]);

ALTER TABLE [dbo].[TaskFundAllocations] ADD CONSTRAINT [FK_TaskFundAllocations_ApprovedBy] 
    FOREIGN KEY([approved_by]) REFERENCES [dbo].[Users] ([user_id]);

ALTER TABLE [dbo].[OrderFundAllocations] ADD CONSTRAINT [FK_OrderFundAllocations_Orders] 
    FOREIGN KEY([order_id]) REFERENCES [dbo].[PendingOrders] ([order_id]);

ALTER TABLE [dbo].[OrderFundAllocations] ADD CONSTRAINT [FK_OrderFundAllocations_Funds] 
    FOREIGN KEY([fund_id]) REFERENCES [dbo].[SponsorFunds] ([fund_id]);

ALTER TABLE [dbo].[OrderFundAllocations] ADD CONSTRAINT [FK_OrderFundAllocations_CreatedBy] 
    FOREIGN KEY([created_by]) REFERENCES [dbo].[Users] ([user_id]);

ALTER TABLE [dbo].[CrossPaymentAudit] ADD CONSTRAINT [FK_CrossPaymentAudit_Orders] 
    FOREIGN KEY([pending_order_id]) REFERENCES [dbo].[PendingOrders] ([order_id]);

ALTER TABLE [dbo].[CrossPaymentAudit] ADD CONSTRAINT [FK_CrossPaymentAudit_PayingSponsors] 
    FOREIGN KEY([paying_sponsor_id]) REFERENCES [dbo].[Sponsors] ([sponsor_id]);

ALTER TABLE [dbo].[CrossPaymentAudit] ADD CONSTRAINT [FK_CrossPaymentAudit_BeneficiarySponsors] 
    FOREIGN KEY([beneficiary_sponsor_id]) REFERENCES [dbo].[Sponsors] ([sponsor_id]);

ALTER TABLE [dbo].[CrossPaymentAudit] ADD CONSTRAINT [FK_CrossPaymentAudit_CreatedBy] 
    FOREIGN KEY([created_by]) REFERENCES [dbo].[Users] ([user_id]);

PRINT 'Procurement and vendor management tables created successfully.';
PRINT '- ProcurementVendors table (Program-isolated vendor management)';
PRINT '- Sponsors table (Funding source management)';
PRINT '- SponsorFunds table (Individual funding streams)';
PRINT '- FundingDocuments table (Contract and agreement tracking)';
PRINT '- TaskFundAllocations table (Task fund tracking)';
PRINT '- OrderFundAllocations table (Order fund tracking)';
PRINT '- CrossPaymentAudit table (Cross-sponsor payment audit)';
PRINT 'Ready for stored procedures creation.';
PRINT '';
