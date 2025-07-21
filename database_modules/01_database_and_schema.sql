-- ==============================================================================
-- 01_DATABASE_AND_SCHEMA.SQL - H10CM CORE INFRASTRUCTURE
-- ==============================================================================
-- This module creates the H10CM database and establishes the core schema.
-- 
-- DEPENDENCIES: None (Run first)
-- CREATES: H10CM database with initial configuration
--
-- Author: H10CM Development Team
-- Created: 2025-07-20
-- Version: H10CM v2.1 Modular
-- ==============================================================================

-- Check if database exists and drop if needed (CAUTION: This will destroy all data!)
IF EXISTS (SELECT name FROM sys.databases WHERE name = 'H10CM')
BEGIN
    PRINT 'Dropping existing H10CM database...';
    ALTER DATABASE H10CM SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE H10CM;
    PRINT 'Existing database dropped.';
END

-- Create the H10CM database
PRINT 'Creating H10CM database...';
CREATE DATABASE H10CM;
GO

-- Switch to the H10CM database
USE H10CM;
GO

-- Set database configuration for optimal performance
ALTER DATABASE H10CM SET RECOVERY FULL;
ALTER DATABASE H10CM SET AUTO_CLOSE OFF;
ALTER DATABASE H10CM SET AUTO_SHRINK OFF;
ALTER DATABASE H10CM SET AUTO_CREATE_STATISTICS ON;
ALTER DATABASE H10CM SET AUTO_UPDATE_STATISTICS ON;

PRINT 'H10CM database created successfully with optimal configuration.';
PRINT 'Database ready for table creation.';
PRINT '';
