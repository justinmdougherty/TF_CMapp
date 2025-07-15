-- Create or update user account for current Windows user
DECLARE @current_user NVARCHAR(255) = SYSTEM_USER;
DECLARE @user_id INT;

-- Check if user exists
SELECT @user_id = user_id FROM dbo.Users WHERE user_name = @current_user;

IF @user_id IS NULL
BEGIN
    -- Create new user account
    INSERT INTO dbo.Users (
        certificate_subject, 
        user_name, 
        display_name, 
        first_name, 
        last_name, 
        initials, 
        is_active, 
        is_system_admin, 
        preferences
    )
    VALUES (
        'CN=' + @current_user + ',OU=Local,O=Development,C=US',
        @current_user,
        @current_user + ' (System Admin)',
        'System',
        'Admin',
        'SA',
        1,
        1,
        '{"theme": "light", "notifications": true}'
    );
    
    SET @user_id = SCOPE_IDENTITY();
    PRINT 'Created new system admin user: ' + @current_user;
END
ELSE
BEGIN
    -- Update existing user to system admin
    UPDATE dbo.Users 
    SET is_system_admin = 1, 
        is_active = 1,
        display_name = @current_user + ' (System Admin)'
    WHERE user_id = @user_id;
    
    PRINT 'Updated existing user to system admin: ' + @current_user;
END

-- Grant system admin role
INSERT INTO dbo.UserRoles (user_id, role_id, assigned_by)
SELECT @user_id, role_id, @user_id
FROM dbo.Roles 
WHERE role_name = 'System Administrator'
AND NOT EXISTS (
    SELECT 1 FROM dbo.UserRoles 
    WHERE user_id = @user_id AND role_id = (SELECT role_id FROM dbo.Roles WHERE role_name = 'System Administrator')
);

-- Grant TF Program access
DECLARE @TFProgramId INT = (SELECT program_id FROM dbo.Programs WHERE program_code = 'TF');
EXEC usp_GrantProgramAccess @user_id, @TFProgramId, 'Admin', @user_id;

-- Show final result
SELECT user_id, user_name, display_name, is_system_admin, is_active FROM dbo.Users WHERE user_id = @user_id;
