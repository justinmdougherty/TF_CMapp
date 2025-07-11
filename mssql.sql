USE [master]
GO
/****** Object:  Database [TFPM]    Script Date: 7/9/2025 2:58:20 PM ******/
CREATE DATABASE [TFPM]
 CONTAINMENT = NONE
 ON  PRIMARY 
( NAME = N'TFPM', FILENAME = N'/var/opt/mssql/data/TFPM.mdf' , SIZE = 8192KB , MAXSIZE = UNLIMITED, FILEGROWTH = 65536KB )
 LOG ON 
( NAME = N'TFPM_log', FILENAME = N'/var/opt/mssql/data/TFPM_log.ldf' , SIZE = 8192KB , MAXSIZE = 2048GB , FILEGROWTH = 65536KB )
 WITH CATALOG_COLLATION = DATABASE_DEFAULT, LEDGER = OFF
GO
ALTER DATABASE [TFPM] SET COMPATIBILITY_LEVEL = 150
GO
IF (1 = FULLTEXTSERVICEPROPERTY('IsFullTextInstalled'))
begin
EXEC [TFPM].[dbo].[sp_fulltext_database] @action = 'enable'
end
GO
ALTER DATABASE [TFPM] SET ANSI_NULL_DEFAULT OFF 
GO
ALTER DATABASE [TFPM] SET ANSI_NULLS OFF 
GO
ALTER DATABASE [TFPM] SET ANSI_PADDING OFF 
GO
ALTER DATABASE [TFPM] SET ANSI_WARNINGS OFF 
GO
ALTER DATABASE [TFPM] SET ARITHABORT OFF 
GO
ALTER DATABASE [TFPM] SET AUTO_CLOSE OFF 
GO
ALTER DATABASE [TFPM] SET AUTO_SHRINK OFF 
GO
ALTER DATABASE [TFPM] SET AUTO_UPDATE_STATISTICS ON 
GO
ALTER DATABASE [TFPM] SET CURSOR_CLOSE_ON_COMMIT OFF 
GO
ALTER DATABASE [TFPM] SET CURSOR_DEFAULT  GLOBAL 
GO
ALTER DATABASE [TFPM] SET CONCAT_NULL_YIELDS_NULL OFF 
GO
ALTER DATABASE [TFPM] SET NUMERIC_ROUNDABORT OFF 
GO
ALTER DATABASE [TFPM] SET QUOTED_IDENTIFIER OFF 
GO
ALTER DATABASE [TFPM] SET RECURSIVE_TRIGGERS OFF 
GO
ALTER DATABASE [TFPM] SET  ENABLE_BROKER 
GO
ALTER DATABASE [TFPM] SET AUTO_UPDATE_STATISTICS_ASYNC OFF 
GO
ALTER DATABASE [TFPM] SET DATE_CORRELATION_OPTIMIZATION OFF 
GO
ALTER DATABASE [TFPM] SET TRUSTWORTHY OFF 
GO
ALTER DATABASE [TFPM] SET ALLOW_SNAPSHOT_ISOLATION OFF 
GO
ALTER DATABASE [TFPM] SET PARAMETERIZATION SIMPLE 
GO
ALTER DATABASE [TFPM] SET READ_COMMITTED_SNAPSHOT OFF 
GO
ALTER DATABASE [TFPM] SET HONOR_BROKER_PRIORITY OFF 
GO
ALTER DATABASE [TFPM] SET RECOVERY FULL 
GO
ALTER DATABASE [TFPM] SET  MULTI_USER 
GO
ALTER DATABASE [TFPM] SET PAGE_VERIFY CHECKSUM  
GO
ALTER DATABASE [TFPM] SET DB_CHAINING OFF 
GO
ALTER DATABASE [TFPM] SET FILESTREAM( NON_TRANSACTED_ACCESS = OFF ) 
GO
ALTER DATABASE [TFPM] SET TARGET_RECOVERY_TIME = 60 SECONDS 
GO
ALTER DATABASE [TFPM] SET DELAYED_DURABILITY = DISABLED 
GO
ALTER DATABASE [TFPM] SET ACCELERATED_DATABASE_RECOVERY = OFF  
GO
ALTER DATABASE [TFPM] SET QUERY_STORE = OFF
GO
USE [TFPM]
GO
/****** Object:  UserDefinedFunction [dbo].[fn_IsValidJson]    Script Date: 7/9/2025 2:58:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE FUNCTION [dbo].[fn_IsValidJson](@json NVARCHAR(MAX))
RETURNS BIT
AS
BEGIN
    RETURN (SELECT ISJSON(@json));
END;
GO
/****** Object:  Table [dbo].[Projects]    Script Date: 7/9/2025 2:58:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Projects](
	[project_id] [int] IDENTITY(1,1) NOT NULL,
	[project_name] [nvarchar](100) NOT NULL,
	[project_description] [nvarchar](max) NULL,
	[status] [nvarchar](50) NULL,
	[date_created] [datetime2](7) NOT NULL,
	[last_modified] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[project_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[project_name] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  View [dbo].[v_Projects_Summary]    Script Date: 7/9/2025 2:58:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE VIEW [dbo].[v_Projects_Summary] AS
SELECT
    project_id,
    project_name,
    project_description,
    status,
    date_created,
    last_modified
FROM dbo.Projects;
GO
/****** Object:  Table [dbo].[InventoryItems]    Script Date: 7/9/2025 2:58:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[InventoryItems](
	[inventory_item_id] [int] IDENTITY(1,1) NOT NULL,
	[item_name] [nvarchar](255) NOT NULL,
	[part_number] [nvarchar](100) NULL,
	[description] [nvarchar](max) NULL,
	[unit_of_measure] [nvarchar](50) NOT NULL,
	[current_stock_level] [decimal](18, 4) NOT NULL,
	[reorder_point] [decimal](18, 4) NULL,
	[supplier_info] [nvarchar](max) NULL,
	[cost_per_unit] [decimal](18, 2) NULL,
PRIMARY KEY CLUSTERED 
(
	[inventory_item_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[part_number] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  View [dbo].[v_InventoryItems_StockStatus]    Script Date: 7/9/2025 2:58:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE VIEW [dbo].[v_InventoryItems_StockStatus] AS
SELECT
    inventory_item_id,
    item_name,
    part_number,
    unit_of_measure,
    current_stock_level,
    reorder_point,
    (CASE WHEN current_stock_level <= reorder_point THEN 'Yes' ELSE 'No' END) AS NeedsReorder
FROM dbo.InventoryItems;
GO
/****** Object:  Table [dbo].[AttributeDefinitions]    Script Date: 7/9/2025 2:58:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[AttributeDefinitions](
	[attribute_definition_id] [int] IDENTITY(1,1) NOT NULL,
	[project_id] [int] NOT NULL,
	[attribute_name] [nvarchar](255) NOT NULL,
	[attribute_type] [nvarchar](50) NOT NULL,
	[display_order] [int] NOT NULL,
	[is_required] [bit] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[attribute_definition_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_ProjectAttributeName] UNIQUE NONCLUSTERED 
(
	[project_id] ASC,
	[attribute_name] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  View [dbo].[v_AttributeDefinitions_ProjectLinked]    Script Date: 7/9/2025 2:58:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE VIEW [dbo].[v_AttributeDefinitions_ProjectLinked] AS
SELECT
    ad.attribute_definition_id,
    ad.project_id,
    p.project_name,
    ad.attribute_name,
    ad.attribute_type,
    ad.display_order,
    ad.is_required
FROM dbo.AttributeDefinitions ad
JOIN dbo.Projects p ON ad.project_id = p.project_id;
GO
/****** Object:  Table [dbo].[ProjectSteps]    Script Date: 7/9/2025 2:58:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ProjectSteps](
	[step_id] [int] IDENTITY(1,1) NOT NULL,
	[project_id] [int] NOT NULL,
	[step_code] [nvarchar](100) NULL,
	[step_name] [nvarchar](255) NOT NULL,
	[step_description] [nvarchar](max) NULL,
	[step_order] [int] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[step_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_ProjectStepCodeAllowNull] UNIQUE NONCLUSTERED 
(
	[project_id] ASC,
	[step_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_ProjectStepOrder] UNIQUE NONCLUSTERED 
(
	[project_id] ASC,
	[step_order] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  View [dbo].[v_ProjectSteps_Ordered]    Script Date: 7/9/2025 2:58:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE VIEW [dbo].[v_ProjectSteps_Ordered] AS
SELECT
    ps.step_id,
    ps.project_id,
    p.project_name,
    ps.step_code,
    ps.step_name,
    ps.step_description,
    ps.step_order
FROM dbo.ProjectSteps ps
JOIN dbo.Projects p ON ps.project_id = p.project_id;
GO
/****** Object:  Table [dbo].[StepInventoryRequirements]    Script Date: 7/9/2025 2:58:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[StepInventoryRequirements](
	[requirement_id] [int] IDENTITY(1,1) NOT NULL,
	[step_id] [int] NOT NULL,
	[inventory_item_id] [int] NOT NULL,
	[quantity_required] [decimal](18, 4) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[requirement_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_StepInventoryItem] UNIQUE NONCLUSTERED 
(
	[step_id] ASC,
	[inventory_item_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  View [dbo].[v_StepInventoryRequirements_Details]    Script Date: 7/9/2025 2:58:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE VIEW [dbo].[v_StepInventoryRequirements_Details] AS
SELECT
    sir.requirement_id,
    sir.step_id,
    ps.step_name,
    ps.project_id,
    proj.project_name,
    sir.inventory_item_id,
    ii.item_name AS inventory_item_name,
    ii.part_number,
    sir.quantity_required,
    ii.unit_of_measure
FROM dbo.StepInventoryRequirements sir
JOIN dbo.ProjectSteps ps ON sir.step_id = ps.step_id
JOIN dbo.InventoryItems ii ON sir.inventory_item_id = ii.inventory_item_id
JOIN dbo.Projects proj ON ps.project_id = proj.project_id;
GO
/****** Object:  Table [dbo].[InventoryTransactions]    Script Date: 7/9/2025 2:58:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[InventoryTransactions](
	[transaction_id] [int] IDENTITY(1,1) NOT NULL,
	[inventory_item_id] [int] NOT NULL,
	[tracked_item_id] [int] NULL,
	[step_id] [int] NULL,
	[transaction_type] [nvarchar](50) NOT NULL,
	[quantity_changed] [decimal](18, 4) NOT NULL,
	[transaction_timestamp] [datetime2](7) NOT NULL,
	[user_name] [nvarchar](255) NULL,
	[notes] [nvarchar](max) NULL,
PRIMARY KEY CLUSTERED 
(
	[transaction_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  View [dbo].[v_InventoryTransactions_Log]    Script Date: 7/9/2025 2:58:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE VIEW [dbo].[v_InventoryTransactions_Log] AS
SELECT
    it.transaction_id,
    it.inventory_item_id,
    ii.item_name,
    ii.part_number,
    it.tracked_item_id,
    it.step_id,
    ps.step_name,
    it.transaction_type,
    it.quantity_changed,
    it.transaction_timestamp,
    it.user_name,
    it.notes
FROM dbo.InventoryTransactions it
JOIN dbo.InventoryItems ii ON it.inventory_item_id = ii.inventory_item_id
LEFT JOIN dbo.ProjectSteps ps ON it.step_id = ps.step_id;
GO
/****** Object:  Table [dbo].[TrackedItems]    Script Date: 7/9/2025 2:58:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[TrackedItems](
	[item_id] [int] IDENTITY(1,1) NOT NULL,
	[project_id] [int] NOT NULL,
	[current_overall_status] [nvarchar](50) NULL,
	[is_shipped] [bit] NOT NULL,
	[shipped_date] [datetime2](7) NULL,
	[date_fully_completed] [datetime2](7) NULL,
	[date_created] [datetime2](7) NOT NULL,
	[last_modified] [datetime2](7) NOT NULL,
	[notes] [nvarchar](max) NULL,
PRIMARY KEY CLUSTERED 
(
	[item_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ItemAttributeValues]    Script Date: 7/9/2025 2:58:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ItemAttributeValues](
	[value_id] [int] IDENTITY(1,1) NOT NULL,
	[item_id] [int] NOT NULL,
	[attribute_definition_id] [int] NOT NULL,
	[attribute_value] [nvarchar](max) NULL,
PRIMARY KEY CLUSTERED 
(
	[value_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_ItemAttributeDefinition] UNIQUE NONCLUSTERED 
(
	[item_id] ASC,
	[attribute_definition_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  View [dbo].[v_TrackedItems_Overview]    Script Date: 7/9/2025 2:58:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE VIEW [dbo].[v_TrackedItems_Overview] AS
SELECT
    ti.item_id,
    ti.project_id,
    p.project_name,
    ti.current_overall_status,
    ti.is_shipped,
    ti.shipped_date,
    ti.date_fully_completed,
    ti.date_created,
    ti.last_modified,
    (SELECT TOP 1 iav.attribute_value
     FROM dbo.ItemAttributeValues iav
     JOIN dbo.AttributeDefinitions ad ON iav.attribute_definition_id = ad.attribute_definition_id
     WHERE iav.item_id = ti.item_id AND (ad.attribute_name LIKE '%Serial%' OR ad.attribute_name LIKE '%ID%')
     ORDER BY ad.display_order, ad.attribute_definition_id
    ) AS primary_identifier,
    ti.notes
FROM dbo.TrackedItems ti
JOIN dbo.Projects p ON ti.project_id = p.project_id;
GO
/****** Object:  View [dbo].[v_ItemAttributeValues_Full]    Script Date: 7/9/2025 2:58:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE VIEW [dbo].[v_ItemAttributeValues_Full] AS
SELECT
    iav.value_id,
    iav.item_id,
    ti.project_id,
    p.project_name,
    iav.attribute_definition_id,
    ad.attribute_name,
    ad.attribute_type,
    iav.attribute_value
FROM dbo.ItemAttributeValues iav
JOIN dbo.TrackedItems ti ON iav.item_id = ti.item_id
JOIN dbo.AttributeDefinitions ad ON iav.attribute_definition_id = ad.attribute_definition_id
JOIN dbo.Projects p ON ti.project_id = p.project_id;
GO
/****** Object:  Table [dbo].[TrackedItemStepProgress]    Script Date: 7/9/2025 2:58:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[TrackedItemStepProgress](
	[item_step_progress_id] [int] IDENTITY(1,1) NOT NULL,
	[item_id] [int] NOT NULL,
	[step_id] [int] NOT NULL,
	[status] [nvarchar](50) NOT NULL,
	[start_timestamp] [datetime2](7) NULL,
	[completion_timestamp] [datetime2](7) NULL,
	[completed_by_user_name] [nvarchar](255) NULL,
	[notes] [nvarchar](max) NULL,
PRIMARY KEY CLUSTERED 
(
	[item_step_progress_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_TrackedItemStep] UNIQUE NONCLUSTERED 
(
	[item_id] ASC,
	[step_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  View [dbo].[v_TrackedItemStepProgress_Status]    Script Date: 7/9/2025 2:58:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE VIEW [dbo].[v_TrackedItemStepProgress_Status] AS
SELECT
    tisp.item_step_progress_id,
    tisp.item_id,
    ti.project_id,
    p.project_name,
    tisp.step_id,
    ps.step_name,
    ps.step_order,
    tisp.status,
    tisp.start_timestamp,
    tisp.completion_timestamp,
    tisp.completed_by_user_name,
    tisp.notes
FROM dbo.TrackedItemStepProgress tisp
JOIN dbo.TrackedItems ti ON tisp.item_id = ti.item_id
JOIN dbo.ProjectSteps ps ON tisp.step_id = ps.step_id
JOIN dbo.Projects p ON ti.project_id = p.project_id;
GO
/****** Object:  Index [IDX_AttributeDefinitions_project_id]    Script Date: 7/9/2025 2:58:20 PM ******/
CREATE NONCLUSTERED INDEX [IDX_AttributeDefinitions_project_id] ON [dbo].[AttributeDefinitions]
(
	[project_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IDX_InventoryTransactions_inventory_item_id]    Script Date: 7/9/2025 2:58:20 PM ******/
CREATE NONCLUSTERED INDEX [IDX_InventoryTransactions_inventory_item_id] ON [dbo].[InventoryTransactions]
(
	[inventory_item_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IDX_InventoryTransactions_step_id]    Script Date: 7/9/2025 2:58:20 PM ******/
CREATE NONCLUSTERED INDEX [IDX_InventoryTransactions_step_id] ON [dbo].[InventoryTransactions]
(
	[step_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IDX_InventoryTransactions_tracked_item_id]    Script Date: 7/9/2025 2:58:20 PM ******/
CREATE NONCLUSTERED INDEX [IDX_InventoryTransactions_tracked_item_id] ON [dbo].[InventoryTransactions]
(
	[tracked_item_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IDX_InventoryTransactions_transaction_timestamp]    Script Date: 7/9/2025 2:58:20 PM ******/
CREATE NONCLUSTERED INDEX [IDX_InventoryTransactions_transaction_timestamp] ON [dbo].[InventoryTransactions]
(
	[transaction_timestamp] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IDX_ItemAttributeValues_attribute_definition_id]    Script Date: 7/9/2025 2:58:20 PM ******/
CREATE NONCLUSTERED INDEX [IDX_ItemAttributeValues_attribute_definition_id] ON [dbo].[ItemAttributeValues]
(
	[attribute_definition_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IDX_ItemAttributeValues_item_id]    Script Date: 7/9/2025 2:58:20 PM ******/
CREATE NONCLUSTERED INDEX [IDX_ItemAttributeValues_item_id] ON [dbo].[ItemAttributeValues]
(
	[item_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IDX_Projects_project_name]    Script Date: 7/9/2025 2:58:20 PM ******/
CREATE NONCLUSTERED INDEX [IDX_Projects_project_name] ON [dbo].[Projects]
(
	[project_name] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IDX_ProjectSteps_project_id]    Script Date: 7/9/2025 2:58:20 PM ******/
CREATE NONCLUSTERED INDEX [IDX_ProjectSteps_project_id] ON [dbo].[ProjectSteps]
(
	[project_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IDX_StepInventoryRequirements_inventory_item_id]    Script Date: 7/9/2025 2:58:20 PM ******/
CREATE NONCLUSTERED INDEX [IDX_StepInventoryRequirements_inventory_item_id] ON [dbo].[StepInventoryRequirements]
(
	[inventory_item_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IDX_StepInventoryRequirements_step_id]    Script Date: 7/9/2025 2:58:20 PM ******/
CREATE NONCLUSTERED INDEX [IDX_StepInventoryRequirements_step_id] ON [dbo].[StepInventoryRequirements]
(
	[step_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IDX_TrackedItems_project_id]    Script Date: 7/9/2025 2:58:20 PM ******/
CREATE NONCLUSTERED INDEX [IDX_TrackedItems_project_id] ON [dbo].[TrackedItems]
(
	[project_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IDX_TrackedItemStepProgress_item_id]    Script Date: 7/9/2025 2:58:20 PM ******/
CREATE NONCLUSTERED INDEX [IDX_TrackedItemStepProgress_item_id] ON [dbo].[TrackedItemStepProgress]
(
	[item_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IDX_TrackedItemStepProgress_step_id]    Script Date: 7/9/2025 2:58:20 PM ******/
CREATE NONCLUSTERED INDEX [IDX_TrackedItemStepProgress_step_id] ON [dbo].[TrackedItemStepProgress]
(
	[step_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
ALTER TABLE [dbo].[AttributeDefinitions] ADD  DEFAULT ((0)) FOR [display_order]
GO
ALTER TABLE [dbo].[AttributeDefinitions] ADD  DEFAULT ((0)) FOR [is_required]
GO
ALTER TABLE [dbo].[InventoryItems] ADD  DEFAULT ((0.0000)) FOR [current_stock_level]
GO
ALTER TABLE [dbo].[InventoryTransactions] ADD  DEFAULT (getdate()) FOR [transaction_timestamp]
GO
ALTER TABLE [dbo].[Projects] ADD  DEFAULT (getdate()) FOR [date_created]
GO
ALTER TABLE [dbo].[Projects] ADD  DEFAULT (getdate()) FOR [last_modified]
GO
ALTER TABLE [dbo].[ProjectSteps] ADD  DEFAULT ((0)) FOR [step_order]
GO
ALTER TABLE [dbo].[TrackedItems] ADD  DEFAULT ('Pending') FOR [current_overall_status]
GO
ALTER TABLE [dbo].[TrackedItems] ADD  DEFAULT ((0)) FOR [is_shipped]
GO
ALTER TABLE [dbo].[TrackedItems] ADD  DEFAULT (getdate()) FOR [date_created]
GO
ALTER TABLE [dbo].[TrackedItems] ADD  DEFAULT (getdate()) FOR [last_modified]
GO
ALTER TABLE [dbo].[TrackedItemStepProgress] ADD  DEFAULT ('Not Started') FOR [status]
GO
ALTER TABLE [dbo].[AttributeDefinitions]  WITH CHECK ADD  CONSTRAINT [FK_AttributeDefinitions_Projects] FOREIGN KEY([project_id])
REFERENCES [dbo].[Projects] ([project_id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[AttributeDefinitions] CHECK CONSTRAINT [FK_AttributeDefinitions_Projects]
GO
ALTER TABLE [dbo].[InventoryTransactions]  WITH CHECK ADD  CONSTRAINT [FK_InventoryTransactions_InventoryItems] FOREIGN KEY([inventory_item_id])
REFERENCES [dbo].[InventoryItems] ([inventory_item_id])
ON UPDATE CASCADE
GO
ALTER TABLE [dbo].[InventoryTransactions] CHECK CONSTRAINT [FK_InventoryTransactions_InventoryItems]
GO
ALTER TABLE [dbo].[InventoryTransactions]  WITH CHECK ADD  CONSTRAINT [FK_InventoryTransactions_ProjectSteps] FOREIGN KEY([step_id])
REFERENCES [dbo].[ProjectSteps] ([step_id])
GO
ALTER TABLE [dbo].[InventoryTransactions] CHECK CONSTRAINT [FK_InventoryTransactions_ProjectSteps]
GO
ALTER TABLE [dbo].[InventoryTransactions]  WITH CHECK ADD  CONSTRAINT [FK_InventoryTransactions_TrackedItems] FOREIGN KEY([tracked_item_id])
REFERENCES [dbo].[TrackedItems] ([item_id])
ON UPDATE CASCADE
ON DELETE SET NULL
GO
ALTER TABLE [dbo].[InventoryTransactions] CHECK CONSTRAINT [FK_InventoryTransactions_TrackedItems]
GO
ALTER TABLE [dbo].[ItemAttributeValues]  WITH CHECK ADD  CONSTRAINT [FK_ItemAttributeValues_AttributeDefinitions] FOREIGN KEY([attribute_definition_id])
REFERENCES [dbo].[AttributeDefinitions] ([attribute_definition_id])
GO
ALTER TABLE [dbo].[ItemAttributeValues] CHECK CONSTRAINT [FK_ItemAttributeValues_AttributeDefinitions]
GO
ALTER TABLE [dbo].[ItemAttributeValues]  WITH CHECK ADD  CONSTRAINT [FK_ItemAttributeValues_TrackedItems] FOREIGN KEY([item_id])
REFERENCES [dbo].[TrackedItems] ([item_id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[ItemAttributeValues] CHECK CONSTRAINT [FK_ItemAttributeValues_TrackedItems]
GO
ALTER TABLE [dbo].[ProjectSteps]  WITH CHECK ADD  CONSTRAINT [FK_ProjectSteps_Projects] FOREIGN KEY([project_id])
REFERENCES [dbo].[Projects] ([project_id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[ProjectSteps] CHECK CONSTRAINT [FK_ProjectSteps_Projects]
GO
ALTER TABLE [dbo].[StepInventoryRequirements]  WITH CHECK ADD  CONSTRAINT [FK_StepInventoryRequirements_InventoryItems] FOREIGN KEY([inventory_item_id])
REFERENCES [dbo].[InventoryItems] ([inventory_item_id])
ON UPDATE CASCADE
GO
ALTER TABLE [dbo].[StepInventoryRequirements] CHECK CONSTRAINT [FK_StepInventoryRequirements_InventoryItems]
GO
ALTER TABLE [dbo].[StepInventoryRequirements]  WITH CHECK ADD  CONSTRAINT [FK_StepInventoryRequirements_ProjectSteps] FOREIGN KEY([step_id])
REFERENCES [dbo].[ProjectSteps] ([step_id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[StepInventoryRequirements] CHECK CONSTRAINT [FK_StepInventoryRequirements_ProjectSteps]
GO
ALTER TABLE [dbo].[TrackedItems]  WITH CHECK ADD  CONSTRAINT [FK_TrackedItems_Projects] FOREIGN KEY([project_id])
REFERENCES [dbo].[Projects] ([project_id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[TrackedItems] CHECK CONSTRAINT [FK_TrackedItems_Projects]
GO
ALTER TABLE [dbo].[TrackedItemStepProgress]  WITH CHECK ADD  CONSTRAINT [FK_TrackedItemStepProgress_ProjectSteps] FOREIGN KEY([step_id])
REFERENCES [dbo].[ProjectSteps] ([step_id])
GO
ALTER TABLE [dbo].[TrackedItemStepProgress] CHECK CONSTRAINT [FK_TrackedItemStepProgress_ProjectSteps]
GO
ALTER TABLE [dbo].[TrackedItemStepProgress]  WITH CHECK ADD  CONSTRAINT [FK_TrackedItemStepProgress_TrackedItems] FOREIGN KEY([item_id])
REFERENCES [dbo].[TrackedItems] ([item_id])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[TrackedItemStepProgress] CHECK CONSTRAINT [FK_TrackedItemStepProgress_TrackedItems]
GO
/****** Object:  StoredProcedure [dbo].[usp_AdjustInventoryStock]    Script Date: 7/9/2025 2:58:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[usp_AdjustInventoryStock]
    @AdjustmentJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    IF dbo.fn_IsValidJson(@AdjustmentJson) = 0 BEGIN SELECT 'Error: Invalid JSON' AS ErrorMessage FOR JSON PATH, ROOT('error'); RETURN; END

    DECLARE @inventory_item_id INT = JSON_VALUE(@AdjustmentJson, '$.inventory_item_id');
    DECLARE @quantity_changed DECIMAL(18, 4) = TRY_CONVERT(DECIMAL(18,4), JSON_VALUE(@AdjustmentJson, '$.quantity_changed'));
    DECLARE @transaction_type NVARCHAR(50) = JSON_VALUE(@AdjustmentJson, '$.transaction_type');
    DECLARE @user_name NVARCHAR(255) = JSON_VALUE(@AdjustmentJson, '$.user_name');
    DECLARE @notes NVARCHAR(MAX) = JSON_VALUE(@AdjustmentJson, '$.notes');

    IF @inventory_item_id IS NULL OR @quantity_changed IS NULL OR @transaction_type IS NULL OR @user_name IS NULL
    BEGIN SELECT 'Error: inventory_item_id, quantity_changed, transaction_type, and user_name are required.' AS ErrorMessage FOR JSON PATH, ROOT('error'); RETURN; END

    IF NOT EXISTS (SELECT 1 FROM dbo.InventoryItems WHERE inventory_item_id = @inventory_item_id)
    BEGIN SELECT 'Error: Invalid inventory_item_id.' AS ErrorMessage FOR JSON PATH, ROOT('error'); RETURN; END

    BEGIN TRY
        EXEC dbo.usp_LogInventoryTransaction
            @inventory_item_id = @inventory_item_id,
            @transaction_type = @transaction_type,
            @quantity_changed = @quantity_changed,
            @user_name = @user_name,
            @notes = @notes;
        
        SELECT 'Inventory adjusted and transaction logged.' AS SuccessMessage FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;
    END TRY
    BEGIN CATCH
        SELECT ERROR_MESSAGE() AS ErrorMessage FOR JSON PATH, ROOT('error'); THROW;
    END CATCH
END;
GO
/****** Object:  StoredProcedure [dbo].[usp_CreateTrackedItem]    Script Date: 7/9/2025 2:58:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[usp_CreateTrackedItem]
    @TrackedItemJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @NewItemId INT;
    DECLARE @OutputTable TABLE (item_id INT);

    IF dbo.fn_IsValidJson(@TrackedItemJson) = 0 BEGIN SELECT 'Error: Invalid JSON' AS ErrorMessage FOR JSON PATH, ROOT('error'); RETURN; END

    DECLARE @project_id INT = JSON_VALUE(@TrackedItemJson, '$.project_id');
    DECLARE @notes NVARCHAR(MAX) = JSON_VALUE(@TrackedItemJson, '$.notes');

    IF @project_id IS NULL OR NOT EXISTS (SELECT 1 FROM dbo.Projects WHERE project_id = @project_id)
    BEGIN SELECT 'Error: Valid project_id is required.' AS ErrorMessage FOR JSON PATH, ROOT('error'); RETURN; END

    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1. Create the TrackedItem
        INSERT INTO dbo.TrackedItems (project_id, notes, current_overall_status, date_created, last_modified)
        OUTPUT inserted.item_id INTO @OutputTable(item_id)
        VALUES (@project_id, @notes, 'Pending', GETDATE(), GETDATE());
        SELECT @NewItemId = item_id FROM @OutputTable;

        -- 2. Initialize TrackedItemStepProgress for all steps of the project
        INSERT INTO dbo.TrackedItemStepProgress (item_id, step_id, status)
        SELECT @NewItemId, ps.step_id, 'Not Started'
        FROM dbo.ProjectSteps ps
        WHERE ps.project_id = @project_id;

        -- 3. Save initial attributes if provided
        DECLARE @AttributesStatusMsg NVARCHAR(100) = 'No initial attributes provided or attributes processed.';
        IF JSON_QUERY(@TrackedItemJson, '$.initial_attributes') IS NOT NULL
        BEGIN
            INSERT INTO dbo.ItemAttributeValues (item_id, attribute_definition_id, attribute_value)
            SELECT
                @NewItemId,
                attr.attribute_definition_id,
                attr.attribute_value
            FROM OPENJSON(@TrackedItemJson, '$.initial_attributes')
            WITH (
                attribute_definition_id INT '$.attribute_definition_id',
                attribute_value NVARCHAR(MAX) '$.attribute_value'
            ) AS attr
            WHERE EXISTS (SELECT 1 FROM dbo.AttributeDefinitions ad WHERE ad.attribute_definition_id = attr.attribute_definition_id AND ad.project_id = @project_id);
            -- Add more robust error handling for invalid attribute_definition_id if needed
        END

        COMMIT TRANSACTION;

        -- Return the created item's summary
        SELECT
            ti.item_id,
            ti.project_id,
            ti.current_overall_status,
            ti.is_shipped,
            ti.shipped_date,
            ti.date_fully_completed,
            ti.date_created,
            ti.last_modified,
            ti.notes,
            @AttributesStatusMsg AS attributes_status,
            'Step progress initialized.' AS steps_status
        FROM dbo.TrackedItems ti
        WHERE ti.item_id = @NewItemId
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT ERROR_MESSAGE() AS ErrorMessage FOR JSON PATH, ROOT('error'); THROW;
    END CATCH
END;
GO
/****** Object:  StoredProcedure [dbo].[usp_DeductInventoryForStepCompletion]    Script Date: 7/9/2025 2:58:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[usp_DeductInventoryForStepCompletion]
    @item_id INT,
    @step_id INT,
    @user_name NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @inventory_item_id INT;
    DECLARE @quantity_required DECIMAL(18,4);

    -- Cursor to iterate over inventory requirements for the step
    DECLARE req_cursor CURSOR FOR
    SELECT inventory_item_id, quantity_required
    FROM dbo.StepInventoryRequirements
    WHERE step_id = @step_id;

    OPEN req_cursor;
    FETCH NEXT FROM req_cursor INTO @inventory_item_id, @quantity_required;

    WHILE @@FETCH_STATUS = 0
    BEGIN
        BEGIN TRY
            -- Using a variable for the negative quantity to avoid potential parser issues.
            DECLARE @quantity_to_deduct DECIMAL(18, 4) = -@quantity_required;
            
            EXEC dbo.usp_LogInventoryTransaction
                @inventory_item_id = @inventory_item_id,
                @transaction_type = 'Consumption',
                @quantity_changed = @quantity_to_deduct, -- Use the new variable
                @user_name = @user_name,
                @tracked_item_id = @item_id,
                @step_id = @step_id,
                @notes = 'Automatic deduction for step completion.';
        END TRY
        BEGIN CATCH
             -- Log error or handle, but continue processing other items if possible
            PRINT 'Error deducting inventory for item_id: ' + CAST(@inventory_item_id AS VARCHAR) + ' for step_id: ' + CAST(@step_id AS VARCHAR) + '. Error: ' + ERROR_MESSAGE();
            -- Depending on requirements, you might re-throw or collect errors.
        END CATCH
        FETCH NEXT FROM req_cursor INTO @inventory_item_id, @quantity_required;
    END
    CLOSE req_cursor;
    DEALLOCATE req_cursor;
END;
GO
/****** Object:  StoredProcedure [dbo].[usp_DeleteAttributeDefinition]    Script Date: 7/9/2025 2:58:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[usp_DeleteAttributeDefinition]
    @attribute_definition_id INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        -- Check if attribute is in use before deleting
        IF EXISTS (SELECT 1 FROM dbo.ItemAttributeValues WHERE attribute_definition_id = @attribute_definition_id)
        BEGIN
            SELECT 'Error: Attribute definition is in use by item attributes and cannot be deleted.' AS ErrorMessage FOR JSON PATH, ROOT('error');
            RETURN;
        END

        DELETE FROM dbo.AttributeDefinitions WHERE attribute_definition_id = @attribute_definition_id;
        
        IF @@ROWCOUNT > 0
            SELECT 'Success: Attribute definition deleted.' AS SuccessMessage FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;
        ELSE
            SELECT 'Warning: Attribute definition not found or already deleted.' AS WarningMessage FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;
            
    END TRY
    BEGIN CATCH
        SELECT ERROR_MESSAGE() AS ErrorMessage FOR JSON PATH, ROOT('error'); THROW;
    END CATCH
END;
GO
/****** Object:  StoredProcedure [dbo].[usp_DeleteProjectStep]    Script Date: 7/9/2025 2:58:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[usp_DeleteProjectStep]
    @step_id INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        -- Check if step is in use
        IF EXISTS (SELECT 1 FROM dbo.TrackedItemStepProgress WHERE step_id = @step_id) OR
           EXISTS (SELECT 1 FROM dbo.StepInventoryRequirements WHERE step_id = @step_id) OR
           EXISTS (SELECT 1 FROM dbo.InventoryTransactions WHERE step_id = @step_id)
        BEGIN
            SELECT 'Error: Project step is in use and cannot be deleted. Consider deactivating or archiving instead.' AS ErrorMessage FOR JSON PATH, ROOT('error');
            RETURN;
        END

        DELETE FROM dbo.ProjectSteps WHERE step_id = @step_id;

        IF @@ROWCOUNT > 0
            SELECT 'Success: Project step deleted.' AS SuccessMessage FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;
        ELSE
            SELECT 'Warning: Project step not found or already deleted.' AS WarningMessage FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;

    END TRY
    BEGIN CATCH
        SELECT ERROR_MESSAGE() AS ErrorMessage FOR JSON PATH, ROOT('error'); THROW;
    END CATCH
END;
GO
/****** Object:  StoredProcedure [dbo].[usp_DeleteStepInventoryRequirement]    Script Date: 7/9/2025 2:58:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[usp_DeleteStepInventoryRequirement]
    @requirement_id INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DELETE FROM dbo.StepInventoryRequirements WHERE requirement_id = @requirement_id;
         IF @@ROWCOUNT > 0
            SELECT 'Success: Step inventory requirement deleted.' AS SuccessMessage FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;
        ELSE
            SELECT 'Warning: Requirement not found or already deleted.' AS WarningMessage FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;
    END TRY
    BEGIN CATCH
        SELECT ERROR_MESSAGE() AS ErrorMessage FOR JSON PATH, ROOT('error'); THROW;
    END CATCH
END;
GO
/****** Object:  StoredProcedure [dbo].[usp_GetAttributeDefinitionsByProjectId]    Script Date: 7/9/2025 2:58:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[usp_GetAttributeDefinitionsByProjectId]
    @project_id INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM dbo.AttributeDefinitions WHERE project_id = @project_id ORDER BY display_order, attribute_name
    FOR JSON PATH, ROOT('data');
END;
GO
/****** Object:  StoredProcedure [dbo].[usp_GetInventoryItemById]    Script Date: 7/9/2025 2:58:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[usp_GetInventoryItemById]
    @inventory_item_id INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM dbo.InventoryItems WHERE inventory_item_id = @inventory_item_id
    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;
END;
GO
/****** Object:  StoredProcedure [dbo].[usp_GetInventoryItems]    Script Date: 7/9/2025 2:58:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[usp_GetInventoryItems]
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM dbo.InventoryItems ORDER BY item_name
    FOR JSON PATH, ROOT('data');
END;
GO
/****** Object:  StoredProcedure [dbo].[usp_GetInventoryTransactionsByItemId]    Script Date: 7/9/2025 2:58:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[usp_GetInventoryTransactionsByItemId]
    @inventory_item_id INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM dbo.InventoryTransactions WHERE inventory_item_id = @inventory_item_id ORDER BY transaction_timestamp DESC
    FOR JSON PATH, ROOT('data');
END;
GO
/****** Object:  StoredProcedure [dbo].[usp_GetProjectById]    Script Date: 7/9/2025 2:58:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[usp_GetProjectById]
    @project_id INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        p.project_id,
        p.project_name,
        p.project_description,
        p.status,
        p.date_created,
        p.last_modified
    FROM dbo.Projects p
    WHERE p.project_id = @project_id
    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;
END;
GO
/****** Object:  StoredProcedure [dbo].[usp_GetProjectDetails]    Script Date: 7/9/2025 2:58:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
     -- Stored Procedure: usp_GetProjectDetails
     -- Returns a comprehensive JSON object for a single project.
     CREATE   PROCEDURE [dbo].[usp_GetProjectDetails]
         @project_id INT
     AS
     BEGIN
         SET NOCOUNT ON;
    
         -- Check if the project exists
        IF NOT EXISTS (SELECT 1 FROM Projects WHERE project_id = @project_id)
        BEGIN
            -- Return NULL (which will become an empty JSON array in the API) to indicate not found
            SELECT NULL AS ProjectDetailsJson;
            RETURN;
        END
   
        -- Select the project details and format as a single JSON object
        SELECT (
            SELECT
                project_id,
                project_name,
                project_description,
                status,
                date_created,
                last_modified
            FROM Projects
            WHERE project_id = @project_id
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        ) AS ProjectDetailsJson;
    END;
GO
/****** Object:  StoredProcedure [dbo].[usp_GetProjects]    Script Date: 7/9/2025 2:58:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER OFF
GO

CREATE PROCEDURE [dbo].[usp_GetProjects]
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @json NVARCHAR(MAX);
    
    -- Get the JSON result
    SELECT @json = (
        SELECT
            p.project_id,
            p.project_name,
            p.project_description,
            p.status,
            p.date_created,
            p.last_modified
        FROM dbo.Projects p
        ORDER BY p.project_name
        FOR JSON PATH
    );
    
    -- Return consistent result
    SELECT ISNULL(@json, '[]') AS json_result;
END;
GO
/****** Object:  StoredProcedure [dbo].[usp_GetProjectStepsByProjectId]    Script Date: 7/9/2025 2:58:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[usp_GetProjectStepsByProjectId]
    @project_id INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM dbo.ProjectSteps WHERE project_id = @project_id ORDER BY step_order, step_name
    FOR JSON PATH, ROOT('data');
END;
GO
/****** Object:  StoredProcedure [dbo].[usp_GetStepInventoryRequirementsByStepId]    Script Date: 7/9/2025 2:58:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[usp_GetStepInventoryRequirementsByStepId]
    @step_id INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        sir.requirement_id,
        sir.step_id,
        sir.inventory_item_id,
        ii.item_name,
        ii.part_number,
        sir.quantity_required,
        ii.unit_of_measure
    FROM dbo.StepInventoryRequirements sir
    JOIN dbo.InventoryItems ii ON sir.inventory_item_id = ii.inventory_item_id
    WHERE sir.step_id = @step_id
    FOR JSON PATH, ROOT('data');
END;
GO
/****** Object:  StoredProcedure [dbo].[usp_GetTrackedItemDetails]    Script Date: 7/9/2025 2:58:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[usp_GetTrackedItemDetails]
    @item_id INT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.TrackedItems WHERE item_id = @item_id)
    BEGIN
        SELECT 'Error: Tracked item not found.' AS ErrorMessage FOR JSON PATH, ROOT('error');
        RETURN;
    END

    SELECT
        (SELECT
            ti.item_id,
            ti.project_id,
            p.project_name,
            ti.current_overall_status,
            ti.is_shipped,
            ti.shipped_date,
            ti.date_fully_completed,
            ti.date_created,
            ti.last_modified,
            ti.notes
         FROM dbo.TrackedItems ti
         JOIN dbo.Projects p ON ti.project_id = p.project_id
         WHERE ti.item_id = @item_id
         FOR JSON PATH, WITHOUT_ARRAY_WRAPPER) AS item_details,

        (SELECT
            ad.attribute_name,
            iav.attribute_value,
            ad.attribute_type,
            ad.display_order
         FROM dbo.ItemAttributeValues iav
         JOIN dbo.AttributeDefinitions ad ON iav.attribute_definition_id = ad.attribute_definition_id
         WHERE iav.item_id = @item_id
         ORDER BY ad.display_order
         FOR JSON PATH) AS attributes,

        (SELECT
            ps.step_id,
            ps.step_name,
            ps.step_code,
            ps.step_order,
            tisp.status,
            tisp.start_timestamp,
            tisp.completion_timestamp,
            tisp.completed_by_user_name,
            tisp.notes AS step_notes,
            (SELECT
                sir.inventory_item_id,
                ii.item_name AS inventory_item_name,
                ii.part_number,
                sir.quantity_required,
                ii.unit_of_measure
             FROM dbo.StepInventoryRequirements sir
             JOIN dbo.InventoryItems ii ON sir.inventory_item_id = ii.inventory_item_id
             WHERE sir.step_id = ps.step_id
             FOR JSON PATH) AS inventory_requirements
         FROM dbo.TrackedItemStepProgress tisp
         JOIN dbo.ProjectSteps ps ON tisp.step_id = ps.step_id
         WHERE tisp.item_id = @item_id
         ORDER BY ps.step_order
         FOR JSON PATH) AS step_progress
    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;
END;
GO
/****** Object:  StoredProcedure [dbo].[usp_GetTrackedItemsByProjectId]    Script Date: 7/9/2025 2:58:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[usp_GetTrackedItemsByProjectId]
    @project_id INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        ti.item_id,
        ti.project_id,
        p.project_name,
        ti.current_overall_status,
        ti.is_shipped,
        ti.date_created,
        ti.last_modified,
        -- Attempt to get a primary identifier like Serial Number if defined
        (SELECT TOP 1 iav.attribute_value
         FROM dbo.ItemAttributeValues iav
         JOIN dbo.AttributeDefinitions ad ON iav.attribute_definition_id = ad.attribute_definition_id
         WHERE iav.item_id = ti.item_id AND (ad.attribute_name LIKE '%Serial Number%' OR ad.attribute_name LIKE '%Identifier%') -- Common names
         ORDER BY ad.display_order
        ) AS primary_identifier
    FROM dbo.TrackedItems ti
    JOIN dbo.Projects p ON ti.project_id = p.project_id
    WHERE ti.project_id = @project_id
    ORDER BY ti.last_modified DESC
    FOR JSON PATH, ROOT('data');
END;
GO
/****** Object:  StoredProcedure [dbo].[usp_LogInventoryTransaction]    Script Date: 7/9/2025 2:58:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[usp_LogInventoryTransaction]
    @inventory_item_id INT,
    @transaction_type NVARCHAR(50),
    @quantity_changed DECIMAL(18, 4),
    @user_name NVARCHAR(255),
    @tracked_item_id INT = NULL,
    @step_id INT = NULL,
    @notes NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        INSERT INTO dbo.InventoryTransactions (inventory_item_id, tracked_item_id, step_id, transaction_type, quantity_changed, transaction_timestamp, user_name, notes)
        VALUES (@inventory_item_id, @tracked_item_id, @step_id, @transaction_type, @quantity_changed, GETDATE(), @user_name, @notes);

        UPDATE dbo.InventoryItems
        SET current_stock_level = current_stock_level + @quantity_changed -- @quantity_changed is negative for consumption
        WHERE inventory_item_id = @inventory_item_id;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW; -- Re-throw to be handled by calling SP or application
    END CATCH
END;
GO
/****** Object:  StoredProcedure [dbo].[usp_SaveAttributeDefinition]    Script Date: 7/9/2025 2:58:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[usp_SaveAttributeDefinition]
    @AttributeJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @OutputTable TABLE (attribute_definition_id INT);
    DECLARE @NewAttributeDefinitionId INT;

    IF dbo.fn_IsValidJson(@AttributeJson) = 0 BEGIN SELECT 'Error: Invalid JSON' AS ErrorMessage FOR JSON PATH, ROOT('error'); RETURN; END

    DECLARE @attribute_definition_id INT = JSON_VALUE(@AttributeJson, '$.attribute_definition_id');
    DECLARE @project_id INT = JSON_VALUE(@AttributeJson, '$.project_id');
    DECLARE @attribute_name NVARCHAR(255) = JSON_VALUE(@AttributeJson, '$.attribute_name');
    DECLARE @attribute_type NVARCHAR(50) = JSON_VALUE(@AttributeJson, '$.attribute_type');
    DECLARE @display_order INT = ISNULL(TRY_CONVERT(INT, JSON_VALUE(@AttributeJson, '$.display_order')), 0);
    DECLARE @is_required BIT = ISNULL(TRY_CONVERT(BIT, JSON_VALUE(@AttributeJson, '$.is_required')), 0);

    IF @project_id IS NULL OR @attribute_name IS NULL OR @attribute_name = '' OR @attribute_type IS NULL OR @attribute_type = ''
    BEGIN SELECT 'Error: project_id, attribute_name, attribute_type are required.' AS ErrorMessage FOR JSON PATH, ROOT('error'); RETURN; END

    IF NOT EXISTS (SELECT 1 FROM dbo.Projects WHERE project_id = @project_id)
    BEGIN SELECT 'Error: Invalid project_id.' AS ErrorMessage FOR JSON PATH, ROOT('error'); RETURN; END

    BEGIN TRY
        BEGIN TRANSACTION;

        IF @attribute_definition_id IS NOT NULL AND EXISTS (SELECT 1 FROM dbo.AttributeDefinitions WHERE attribute_definition_id = @attribute_definition_id)
        BEGIN
            UPDATE dbo.AttributeDefinitions
            SET project_id = @project_id,
                attribute_name = @attribute_name,
                attribute_type = @attribute_type,
                display_order = @display_order,
                is_required = @is_required
            WHERE attribute_definition_id = @attribute_definition_id;
            SET @NewAttributeDefinitionId = @attribute_definition_id;
        END
        ELSE
        BEGIN
             -- Check for uniqueness on (project_id, attribute_name) before insert
            IF EXISTS (SELECT 1 FROM dbo.AttributeDefinitions WHERE project_id = @project_id AND attribute_name = @attribute_name)
            BEGIN
                SELECT 'Error: Attribute name already exists for this project.' AS ErrorMessage FOR JSON PATH, ROOT('error');
                IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
                RETURN;
            END

            INSERT INTO dbo.AttributeDefinitions (project_id, attribute_name, attribute_type, display_order, is_required)
            OUTPUT inserted.attribute_definition_id INTO @OutputTable(attribute_definition_id)
            VALUES (@project_id, @attribute_name, @attribute_type, @display_order, @is_required);
            SELECT @NewAttributeDefinitionId = attribute_definition_id FROM @OutputTable;
        END

        COMMIT TRANSACTION;

        SELECT * FROM dbo.AttributeDefinitions WHERE attribute_definition_id = @NewAttributeDefinitionId
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT ERROR_MESSAGE() AS ErrorMessage FOR JSON PATH, ROOT('error'); THROW;
    END CATCH
END;
GO
/****** Object:  StoredProcedure [dbo].[usp_SaveInventoryItem]    Script Date: 7/9/2025 2:58:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[usp_SaveInventoryItem]
    @ItemJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @OutputTable TABLE (inventory_item_id INT);
    DECLARE @NewInventoryItemId INT;

    IF dbo.fn_IsValidJson(@ItemJson) = 0
    BEGIN
        SELECT 'Error: Invalid JSON format provided.' AS ErrorMessage FOR JSON PATH, ROOT('error');
        RETURN;
    END

    DECLARE @inventory_item_id INT = JSON_VALUE(@ItemJson, '$.inventory_item_id');
    DECLARE @item_name NVARCHAR(255) = JSON_VALUE(@ItemJson, '$.item_name');
    DECLARE @part_number NVARCHAR(100) = JSON_VALUE(@ItemJson, '$.part_number');
    DECLARE @description NVARCHAR(MAX) = JSON_VALUE(@ItemJson, '$.description');
    DECLARE @unit_of_measure NVARCHAR(50) = JSON_VALUE(@ItemJson, '$.unit_of_measure');
    DECLARE @current_stock_level DECIMAL(18, 4) = ISNULL(TRY_CONVERT(DECIMAL(18,4), JSON_VALUE(@ItemJson, '$.current_stock_level')), 0.0000);
    DECLARE @reorder_point DECIMAL(18, 4) = TRY_CONVERT(DECIMAL(18,4), JSON_VALUE(@ItemJson, '$.reorder_point'));
    DECLARE @supplier_info NVARCHAR(MAX) = JSON_VALUE(@ItemJson, '$.supplier_info');
    DECLARE @cost_per_unit DECIMAL(18, 2) = TRY_CONVERT(DECIMAL(18,2), JSON_VALUE(@ItemJson, '$.cost_per_unit'));

    IF @item_name IS NULL OR @item_name = '' OR @unit_of_measure IS NULL OR @unit_of_measure = ''
    BEGIN
        SELECT 'Error: Item name and unit of measure are required.' AS ErrorMessage FOR JSON PATH, ROOT('error');
        RETURN;
    END

    BEGIN TRY
        BEGIN TRANSACTION;

        IF @inventory_item_id IS NOT NULL AND EXISTS (SELECT 1 FROM dbo.InventoryItems WHERE inventory_item_id = @inventory_item_id)
        BEGIN
            UPDATE dbo.InventoryItems
            SET item_name = @item_name,
                part_number = @part_number,
                description = @description,
                unit_of_measure = @unit_of_measure,
                current_stock_level = @current_stock_level,
                reorder_point = @reorder_point,
                supplier_info = @supplier_info,
                cost_per_unit = @cost_per_unit
            WHERE inventory_item_id = @inventory_item_id;
            SET @NewInventoryItemId = @inventory_item_id;
        END
        ELSE
        BEGIN
            INSERT INTO dbo.InventoryItems (item_name, part_number, description, unit_of_measure, current_stock_level, reorder_point, supplier_info, cost_per_unit)
            OUTPUT inserted.inventory_item_id INTO @OutputTable(inventory_item_id)
            VALUES (@item_name, @part_number, @description, @unit_of_measure, @current_stock_level, @reorder_point, @supplier_info, @cost_per_unit);
            SELECT @NewInventoryItemId = inventory_item_id FROM @OutputTable;
        END

        COMMIT TRANSACTION;

        SELECT * FROM dbo.InventoryItems WHERE inventory_item_id = @NewInventoryItemId
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        SELECT ERROR_MESSAGE() AS ErrorMessage FOR JSON PATH, ROOT('error');
        THROW;
    END CATCH
END;
GO
/****** Object:  StoredProcedure [dbo].[usp_SaveItemAttributeValues]    Script Date: 7/9/2025 2:58:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[usp_SaveItemAttributeValues]
    @ValuesJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    IF dbo.fn_IsValidJson(@ValuesJson) = 0 BEGIN SELECT 'Error: Invalid JSON' AS ErrorMessage FOR JSON PATH, ROOT('error'); RETURN; END

    DECLARE @item_id INT = JSON_VALUE(@ValuesJson, '$.item_id');

    IF @item_id IS NULL OR NOT EXISTS (SELECT 1 FROM dbo.TrackedItems WHERE item_id = @item_id)
    BEGIN SELECT 'Error: Valid item_id is required.' AS ErrorMessage FOR JSON PATH, ROOT('error'); RETURN; END

    BEGIN TRY
        BEGIN TRANSACTION;

        MERGE dbo.ItemAttributeValues AS Target
        USING (
            SELECT
                attr.attribute_definition_id,
                attr.attribute_value
            FROM OPENJSON(@ValuesJson, '$.attributes')
            WITH (
                attribute_definition_id INT '$.attribute_definition_id',
                attribute_value NVARCHAR(MAX) '$.attribute_value'
            ) AS attr
            -- Ensure attribute definition exists and belongs to the item's project
            INNER JOIN dbo.TrackedItems ti ON ti.item_id = @item_id
            INNER JOIN dbo.AttributeDefinitions ad ON ad.attribute_definition_id = attr.attribute_definition_id AND ad.project_id = ti.project_id
        ) AS Source
        ON Target.item_id = @item_id AND Target.attribute_definition_id = Source.attribute_definition_id
        WHEN MATCHED THEN
            UPDATE SET attribute_value = Source.attribute_value
        WHEN NOT MATCHED BY TARGET THEN
            INSERT (item_id, attribute_definition_id, attribute_value)
            VALUES (@item_id, Source.attribute_definition_id, Source.attribute_value);
        -- WHEN NOT MATCHED BY SOURCE AND Target.item_id = @item_id THEN DELETE; -- Optional: to remove attributes not in the list

        UPDATE dbo.TrackedItems SET last_modified = GETDATE() WHERE item_id = @item_id;

        COMMIT TRANSACTION;
        SELECT 'Attribute values saved for item_id ' + CONVERT(NVARCHAR, @item_id) + '.' AS SuccessMessage
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT ERROR_MESSAGE() AS ErrorMessage FOR JSON PATH, ROOT('error'); THROW;
    END CATCH
END;
GO
/****** Object:  StoredProcedure [dbo].[usp_SaveProject]    Script Date: 7/9/2025 2:58:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[usp_SaveProject]
    @ProjectJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @OutputTable TABLE (project_id INT);
    DECLARE @NewProjectId INT;

    IF dbo.fn_IsValidJson(@ProjectJson) = 0
    BEGIN
        SELECT 'Error: Invalid JSON format provided.' AS ErrorMessage FOR JSON PATH, ROOT('error');
        RETURN;
    END

    DECLARE @project_id INT = JSON_VALUE(@ProjectJson, '$.project_id');
    DECLARE @project_name NVARCHAR(100) = JSON_VALUE(@ProjectJson, '$.project_name');
    DECLARE @project_description NVARCHAR(MAX) = JSON_VALUE(@ProjectJson, '$.project_description');
    DECLARE @status NVARCHAR(50) = JSON_VALUE(@ProjectJson, '$.status');

    IF @project_name IS NULL OR @project_name = ''
    BEGIN
        SELECT 'Error: Project name is required.' AS ErrorMessage FOR JSON PATH, ROOT('error');
        RETURN;
    END

    BEGIN TRY
        BEGIN TRANSACTION;

        IF @project_id IS NOT NULL AND EXISTS (SELECT 1 FROM dbo.Projects WHERE project_id = @project_id)
        BEGIN
            -- Update existing project
            UPDATE dbo.Projects
            SET project_name = ISNULL(@project_name, project_name),
                project_description = ISNULL(@project_description, project_description),
                status = ISNULL(@status, status),
                last_modified = GETDATE()
            WHERE project_id = @project_id;
            SET @NewProjectId = @project_id;
        END
        ELSE
        BEGIN
            -- Insert new project
            INSERT INTO dbo.Projects (project_name, project_description, status, date_created, last_modified)
            OUTPUT inserted.project_id INTO @OutputTable(project_id)
            VALUES (@project_name, @project_description, @status, GETDATE(), GETDATE());
            SELECT @NewProjectId = project_id FROM @OutputTable;
        END

        COMMIT TRANSACTION;

        -- Return the saved project details
        SELECT
            p.project_id,
            p.project_name,
            p.project_description,
            p.status,
            p.date_created,
            p.last_modified
        FROM dbo.Projects p
        WHERE p.project_id = @NewProjectId
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        SELECT ERROR_MESSAGE() AS ErrorMessage FOR JSON PATH, ROOT('error');
        THROW; -- Re-throw the error to be caught by the application if needed
    END CATCH
END;
GO
/****** Object:  StoredProcedure [dbo].[usp_SaveProjectStep]    Script Date: 7/9/2025 2:58:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[usp_SaveProjectStep]
    @StepJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @OutputTable TABLE (step_id INT);
    DECLARE @NewStepId INT;

    IF dbo.fn_IsValidJson(@StepJson) = 0 BEGIN SELECT 'Error: Invalid JSON' AS ErrorMessage FOR JSON PATH, ROOT('error'); RETURN; END

    DECLARE @step_id INT = JSON_VALUE(@StepJson, '$.step_id');
    DECLARE @project_id INT = JSON_VALUE(@StepJson, '$.project_id');
    DECLARE @step_code NVARCHAR(100) = JSON_VALUE(@StepJson, '$.step_code');
    DECLARE @step_name NVARCHAR(255) = JSON_VALUE(@StepJson, '$.step_name');
    DECLARE @step_description NVARCHAR(MAX) = JSON_VALUE(@StepJson, '$.step_description');
    DECLARE @step_order INT = ISNULL(TRY_CONVERT(INT, JSON_VALUE(@StepJson, '$.step_order')), 0);

    IF @project_id IS NULL OR @step_name IS NULL OR @step_name = ''
    BEGIN SELECT 'Error: project_id and step_name are required.' AS ErrorMessage FOR JSON PATH, ROOT('error'); RETURN; END

    IF NOT EXISTS (SELECT 1 FROM dbo.Projects WHERE project_id = @project_id)
    BEGIN SELECT 'Error: Invalid project_id.' AS ErrorMessage FOR JSON PATH, ROOT('error'); RETURN; END

    BEGIN TRY
        BEGIN TRANSACTION;

        IF @step_id IS NOT NULL AND EXISTS (SELECT 1 FROM dbo.ProjectSteps WHERE step_id = @step_id)
        BEGIN
            UPDATE dbo.ProjectSteps
            SET project_id = @project_id,
                step_code = @step_code,
                step_name = @step_name,
                step_description = @step_description,
                step_order = @step_order
            WHERE step_id = @step_id;
            SET @NewStepId = @step_id;
        END
        ELSE
        BEGIN
            -- Check for uniqueness on (project_id, step_order) and (project_id, step_code if not null)
            IF EXISTS (SELECT 1 FROM dbo.ProjectSteps WHERE project_id = @project_id AND step_order = @step_order)
            BEGIN
                SELECT 'Error: Step order already exists for this project.' AS ErrorMessage FOR JSON PATH, ROOT('error');
                IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION; RETURN;
            END
            IF @step_code IS NOT NULL AND EXISTS (SELECT 1 FROM dbo.ProjectSteps WHERE project_id = @project_id AND step_code = @step_code)
            BEGIN
                SELECT 'Error: Step code already exists for this project.' AS ErrorMessage FOR JSON PATH, ROOT('error');
                IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION; RETURN;
            END

            INSERT INTO dbo.ProjectSteps (project_id, step_code, step_name, step_description, step_order)
            OUTPUT inserted.step_id INTO @OutputTable(step_id)
            VALUES (@project_id, @step_code, @step_name, @step_description, @step_order);
            SELECT @NewStepId = step_id FROM @OutputTable;
        END

        COMMIT TRANSACTION;
        SELECT * FROM dbo.ProjectSteps WHERE step_id = @NewStepId
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT ERROR_MESSAGE() AS ErrorMessage FOR JSON PATH, ROOT('error'); THROW;
    END CATCH
END;
GO
/****** Object:  StoredProcedure [dbo].[usp_SaveStepInventoryRequirement]    Script Date: 7/9/2025 2:58:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[usp_SaveStepInventoryRequirement]
    @RequirementJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @OutputTable TABLE (requirement_id INT);
    DECLARE @NewRequirementId INT;

    IF dbo.fn_IsValidJson(@RequirementJson) = 0 BEGIN SELECT 'Error: Invalid JSON' AS ErrorMessage FOR JSON PATH, ROOT('error'); RETURN; END

    DECLARE @requirement_id INT = JSON_VALUE(@RequirementJson, '$.requirement_id');
    DECLARE @step_id INT = JSON_VALUE(@RequirementJson, '$.step_id');
    DECLARE @inventory_item_id INT = JSON_VALUE(@RequirementJson, '$.inventory_item_id');
    DECLARE @quantity_required DECIMAL(18,4) = TRY_CONVERT(DECIMAL(18,4), JSON_VALUE(@RequirementJson, '$.quantity_required'));

    IF @step_id IS NULL OR @inventory_item_id IS NULL OR @quantity_required IS NULL OR @quantity_required <= 0
    BEGIN SELECT 'Error: step_id, inventory_item_id, and a positive quantity_required are required.' AS ErrorMessage FOR JSON PATH, ROOT('error'); RETURN; END

    IF NOT EXISTS (SELECT 1 FROM dbo.ProjectSteps WHERE step_id = @step_id)
    BEGIN SELECT 'Error: Invalid step_id.' AS ErrorMessage FOR JSON PATH, ROOT('error'); RETURN; END
    IF NOT EXISTS (SELECT 1 FROM dbo.InventoryItems WHERE inventory_item_id = @inventory_item_id)
    BEGIN SELECT 'Error: Invalid inventory_item_id.' AS ErrorMessage FOR JSON PATH, ROOT('error'); RETURN; END

    BEGIN TRY
        BEGIN TRANSACTION;

        IF @requirement_id IS NOT NULL AND EXISTS (SELECT 1 FROM dbo.StepInventoryRequirements WHERE requirement_id = @requirement_id)
        BEGIN
            UPDATE dbo.StepInventoryRequirements
            SET step_id = @step_id,
                inventory_item_id = @inventory_item_id,
                quantity_required = @quantity_required
            WHERE requirement_id = @requirement_id;
            SET @NewRequirementId = @requirement_id;
        END
        ELSE
        BEGIN
            -- Check UQ_StepInventoryItem
            IF EXISTS (SELECT 1 FROM dbo.StepInventoryRequirements WHERE step_id = @step_id AND inventory_item_id = @inventory_item_id)
            BEGIN
                SELECT 'Error: This inventory item is already a requirement for this step.' AS ErrorMessage FOR JSON PATH, ROOT('error');
                IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION; RETURN;
            END
            INSERT INTO dbo.StepInventoryRequirements (step_id, inventory_item_id, quantity_required)
            OUTPUT inserted.requirement_id INTO @OutputTable(requirement_id)
            VALUES (@step_id, @inventory_item_id, @quantity_required);
            SELECT @NewRequirementId = requirement_id FROM @OutputTable;
        END

        COMMIT TRANSACTION;
        SELECT * FROM dbo.StepInventoryRequirements WHERE requirement_id = @NewRequirementId
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT ERROR_MESSAGE() AS ErrorMessage FOR JSON PATH, ROOT('error'); THROW;
    END CATCH
END;
GO
/****** Object:  StoredProcedure [dbo].[usp_UpdateTrackedItemDetails]    Script Date: 7/9/2025 2:58:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[usp_UpdateTrackedItemDetails]
    @DetailsJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    IF dbo.fn_IsValidJson(@DetailsJson) = 0 BEGIN SELECT 'Error: Invalid JSON' AS ErrorMessage FOR JSON PATH, ROOT('error'); RETURN; END

    DECLARE @item_id INT = JSON_VALUE(@DetailsJson, '$.item_id');
    DECLARE @current_overall_status NVARCHAR(50) = JSON_VALUE(@DetailsJson, '$.current_overall_status');
    DECLARE @is_shipped BIT = TRY_CONVERT(BIT, JSON_VALUE(@DetailsJson, '$.is_shipped'));
    DECLARE @shipped_date DATETIME2 = TRY_CONVERT(DATETIME2, JSON_VALUE(@DetailsJson, '$.shipped_date'));
    DECLARE @notes NVARCHAR(MAX) = JSON_VALUE(@DetailsJson, '$.notes');

    IF @item_id IS NULL OR NOT EXISTS (SELECT 1 FROM dbo.TrackedItems WHERE item_id = @item_id)
    BEGIN SELECT 'Error: Valid item_id is required.' AS ErrorMessage FOR JSON PATH, ROOT('error'); RETURN; END

    BEGIN TRY
        UPDATE dbo.TrackedItems
        SET current_overall_status = ISNULL(@current_overall_status, current_overall_status),
            is_shipped = ISNULL(@is_shipped, is_shipped),
            shipped_date = CASE WHEN @is_shipped = 1 AND shipped_date IS NULL THEN ISNULL(@shipped_date, GETDATE()) ELSE @shipped_date END,
            notes = ISNULL(@notes, notes),
            last_modified = GETDATE()
        WHERE item_id = @item_id;

        SELECT * FROM dbo.TrackedItems WHERE item_id = @item_id
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;
    END TRY
    BEGIN CATCH
        SELECT ERROR_MESSAGE() AS ErrorMessage FOR JSON PATH, ROOT('error'); THROW;
    END CATCH
END;
GO
/****** Object:  StoredProcedure [dbo].[usp_UpdateTrackedItemStepProgress]    Script Date: 7/9/2025 2:58:20 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[usp_UpdateTrackedItemStepProgress]
    @ProgressJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    IF dbo.fn_IsValidJson(@ProgressJson) = 0 BEGIN SELECT 'Error: Invalid JSON' AS ErrorMessage FOR JSON PATH, ROOT('error'); RETURN; END

    DECLARE @item_id INT = JSON_VALUE(@ProgressJson, '$.item_id');
    DECLARE @step_id INT = JSON_VALUE(@ProgressJson, '$.step_id');
    DECLARE @status NVARCHAR(50) = JSON_VALUE(@ProgressJson, '$.status');
    DECLARE @completed_by_user_name NVARCHAR(255) = JSON_VALUE(@ProgressJson, '$.completed_by_user_name');
    DECLARE @notes NVARCHAR(MAX) = JSON_VALUE(@ProgressJson, '$.notes');
    
    DECLARE @start_timestamp DATETIME2 = NULL;
    DECLARE @completion_timestamp DATETIME2 = NULL;
    DECLARE @OverallItemStatusUpdated BIT = 0;

    IF @item_id IS NULL OR @step_id IS NULL OR @status IS NULL
    BEGIN SELECT 'Error: item_id, step_id, and status are required.' AS ErrorMessage FOR JSON PATH, ROOT('error'); RETURN; END

    IF NOT EXISTS (SELECT 1 FROM dbo.TrackedItemStepProgress WHERE item_id = @item_id AND step_id = @step_id)
    BEGIN SELECT 'Error: Tracked item step progress record not found.' AS ErrorMessage FOR JSON PATH, ROOT('error'); RETURN; END

    DECLARE @current_status NVARCHAR(50);
    SELECT @current_status = status FROM dbo.TrackedItemStepProgress WHERE item_id = @item_id AND step_id = @step_id;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF @status = 'In Progress' AND (@current_status = 'Not Started' OR @current_status IS NULL)
            SET @start_timestamp = GETDATE();
        ELSE IF @status = 'Complete' AND @current_status <> 'Complete' -- Only set completion if not already complete
            SET @completion_timestamp = GETDATE();


        UPDATE dbo.TrackedItemStepProgress
        SET status = @status,
            start_timestamp = CASE WHEN @start_timestamp IS NOT NULL THEN @start_timestamp ELSE start_timestamp END,
            completion_timestamp = CASE WHEN @completion_timestamp IS NOT NULL THEN @completion_timestamp ELSE completion_timestamp END,
            completed_by_user_name = ISNULL(@completed_by_user_name, completed_by_user_name),
            notes = ISNULL(@notes, notes)
        WHERE item_id = @item_id AND step_id = @step_id;

        UPDATE dbo.TrackedItems SET last_modified = GETDATE() WHERE item_id = @item_id;

        -- If step is marked as 'Complete' and was not 'Complete' before, deduct inventory
        IF @status = 'Complete' AND @current_status <> 'Complete'
        BEGIN
            IF @completed_by_user_name IS NULL
            BEGIN
                 SELECT 'Error: completed_by_user_name is required when marking a step as Complete.' AS ErrorMessage FOR JSON PATH, ROOT('error');
                 IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION; RETURN;
            END
            EXEC dbo.usp_DeductInventoryForStepCompletion @item_id, @step_id, @completed_by_user_name;
        END

        -- Check if all steps for this item are now complete
        DECLARE @project_id INT;
        SELECT @project_id = project_id FROM dbo.TrackedItems WHERE item_id = @item_id;

        DECLARE @total_steps INT;
        DECLARE @completed_steps INT;

        SELECT @total_steps = COUNT(*) FROM dbo.ProjectSteps WHERE project_id = @project_id;
        SELECT @completed_steps = COUNT(*) FROM dbo.TrackedItemStepProgress
        WHERE item_id = @item_id AND status = 'Complete';

        IF @total_steps > 0 AND @completed_steps = @total_steps
        BEGIN
            UPDATE dbo.TrackedItems
            SET date_fully_completed = GETDATE(),
                current_overall_status = 'Completed',
                last_modified = GETDATE()
            WHERE item_id = @item_id AND date_fully_completed IS NULL; -- Only update if not already fully completed
            SET @OverallItemStatusUpdated = 1;
        END

        COMMIT TRANSACTION;

        SELECT
            tisp.*,
            @OverallItemStatusUpdated AS overall_item_status_updated
        FROM dbo.TrackedItemStepProgress tisp
        WHERE item_id = @item_id AND step_id = @step_id
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT ERROR_MESSAGE() AS ErrorMessage FOR JSON PATH, ROOT('error'); THROW;
    END CATCH
END;
GO
USE [master]
GO
ALTER DATABASE [TFPM] SET  READ_WRITE 
GO
