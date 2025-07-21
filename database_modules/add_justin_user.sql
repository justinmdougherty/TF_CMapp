-- ==============================================================================
-- ADD JUSTIN'S USER ACCOUNT - H10CM DEVELOPMENT
-- ==============================================================================
-- This script adds Justin Dougherty's user account with proper certificate subject
-- and grants system admin access to all programs for development purposes.
--
-- Author: H10CM Development Team
-- Created: 2025-07-20
-- Purpose: Fix authentication issue for development environment
-- ==============================================================================

USE H10CM;
GO

PRINT 'Adding Justin Dougherty user account...';

-- Check if user already exists
IF NOT EXISTS (SELECT 1 FROM Users WHERE certificate_subject = 'CN=DOUGHERTY.JUSTIN.MICHAEL.1250227228,OU=USN,OU=PKI,OU=DoD,O=U.S. Government,C=US')
BEGIN
    -- Insert Justin's user account
    INSERT INTO Users (
        certificate_subject,
        user_name,
        display_name, 
        first_name, 
        last_name, 
        email, 
        initials,
        is_active, 
        is_system_admin,
        date_created, 
        last_modified
    ) VALUES (
        'CN=DOUGHERTY.JUSTIN.MICHAEL.1250227228,OU=USN,OU=PKI,OU=DoD,O=U.S. Government,C=US',
        'justin.dougherty',
        'Justin Dougherty',
        'Justin',
        'Dougherty',
        'justin.dougherty@navy.mil',
        'JD',
        1,
        1, -- System admin
        GETDATE(),
        GETDATE()
    );
    
    DECLARE @JustinUserId INT = (SELECT user_id FROM Users WHERE certificate_subject = 'CN=DOUGHERTY.JUSTIN.MICHAEL.1250227228,OU=USN,OU=PKI,OU=DoD,O=U.S. Government,C=US');
    
    -- Grant access to all existing programs
    INSERT INTO ProgramAccess (user_id, program_id, access_level, granted_by, date_granted)
    SELECT @JustinUserId, program_id, 'Admin', @JustinUserId, GETDATE()
    FROM Programs
    WHERE is_active = 1;
    
    PRINT 'Justin Dougherty user account created successfully with system admin privileges.';
    PRINT 'User ID: ' + CAST(@JustinUserId AS VARCHAR);
    PRINT 'Program access granted to all active programs.';
END
ELSE
BEGIN
    PRINT 'Justin Dougherty user account already exists.';
    
    -- Update to ensure system admin status
    UPDATE Users 
    SET is_system_admin = 1,
        last_modified = GETDATE()
    WHERE certificate_subject = 'CN=DOUGHERTY.JUSTIN.MICHAEL.1250227228,OU=USN,OU=PKI,OU=DoD,O=U.S. Government,C=US';
    
    PRINT 'Updated user account to ensure system admin privileges.';
END

-- Verify the user account
SELECT 
    user_id,
    certificate_subject,
    display_name,
    email,
    is_active,
    is_system_admin,
    date_created
FROM Users 
WHERE certificate_subject = 'CN=DOUGHERTY.JUSTIN.MICHAEL.1250227228,OU=USN,OU=PKI,OU=DoD,O=U.S. Government,C=US';

-- Show program access
SELECT 
    u.display_name,
    p.program_name,
    pa.access_level,
    pa.date_granted
FROM Users u
JOIN ProgramAccess pa ON u.user_id = pa.user_id
JOIN Programs p ON pa.program_id = p.program_id
WHERE u.certificate_subject = 'CN=DOUGHERTY.JUSTIN.MICHAEL.1250227228,OU=USN,OU=PKI,OU=DoD,O=U.S. Government,C=US'
ORDER BY p.program_name;

PRINT '';
PRINT 'Justin Dougherty user setup completed successfully!';
PRINT 'The API authentication should now work correctly.';
