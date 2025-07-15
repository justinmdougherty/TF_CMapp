const sql = require('mssql');

const config = {
  user: 'sa',
  password: '0)Password',
  server: '127.0.0.1',
  database: 'H10CM',
  port: 1433,
  options: {
    encrypt: true,
    enableArithAbort: true,
    trustServerCertificate: true
  }
};

async function fixUserRole() {
  try {
    const pool = await sql.connect(config);
    
    // First, check the Users table structure
    console.log('=== Checking Users table structure ===');
    const tableStructure = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'Users'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('Users table columns:', JSON.stringify(tableStructure.recordset, null, 2));
    
    // Check Justin Dougherty's current role
    console.log('=== Checking Justin Dougherty\'s current role ===');
    const userCheck = await pool.request().query(`
      SELECT 
        u.user_id,
        u.display_name,
        u.is_system_admin,
        r.role_name
      FROM Users u
      LEFT JOIN UserRoles ur ON u.user_id = ur.user_id
      LEFT JOIN Roles r ON ur.role_id = r.role_id
      WHERE u.display_name = 'Justin Dougherty'
    `);
    
    console.log('Current user info:', JSON.stringify(userCheck.recordset, null, 2));
    
    if (userCheck.recordset.length > 0) {
      const userId = userCheck.recordset[0].user_id;
      
      // Update user to be system admin
      console.log('=== Updating user to system admin ===');
      await pool.request()
        .input('user_id', sql.Int, userId)
        .query(`
          UPDATE Users 
          SET is_system_admin = 1 
          WHERE user_id = @user_id
        `);
      
      // Also assign Site Admin role if not already assigned
      console.log('=== Assigning Site Admin role ===');
      await pool.request()
        .input('user_id', sql.Int, userId)
        .query(`
          IF NOT EXISTS (SELECT 1 FROM UserRoles ur 
                        INNER JOIN Roles r ON ur.role_id = r.role_id 
                        WHERE ur.user_id = @user_id AND r.role_name = 'Site Admin')
          BEGIN
            INSERT INTO UserRoles (user_id, role_id, assigned_by, date_assigned)
            SELECT @user_id, r.role_id, @user_id, GETDATE()
            FROM Roles r
            WHERE r.role_name = 'Site Admin'
          END
        `);
      
      // Verify the changes
      console.log('=== Verifying changes ===');
      const verifyResult = await pool.request().query(`
        SELECT 
          u.user_id,
          u.display_name,
          u.is_system_admin,
          r.role_name
        FROM Users u
        LEFT JOIN UserRoles ur ON u.user_id = ur.user_id
        LEFT JOIN Roles r ON ur.role_id = r.role_id
        WHERE u.display_name = 'Justin Dougherty'
      `);
      
      console.log('Updated user info:', JSON.stringify(verifyResult.recordset, null, 2));
      
    } else {
      console.log('Justin Dougherty user not found!');
    }
    
    await sql.close();
    console.log('✅ User role update completed');
    
  } catch (err) {
    console.error('❌ Error updating user role:', err);
    await sql.close();
  }
}

fixUserRole();
