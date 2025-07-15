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

async function checkProcedure() {
  try {
    const pool = await sql.connect(config);
    
    const result = await pool.request().query(`
      SELECT 
        OBJECT_NAME(object_id) as ProcedureName,
        parameter_id,
        name as parameter_name,
        TYPE_NAME(system_type_id) as data_type,
        max_length
      FROM sys.parameters 
      WHERE object_id = OBJECT_ID('usp_SaveInventoryItem')
      ORDER BY parameter_id
    `);
    
    console.log('Parameters for usp_SaveInventoryItem:');
    console.log(JSON.stringify(result.recordset, null, 2));
    
    await sql.close();
  } catch (err) {
    console.error('Error:', err);
    await sql.close();
  }
}

checkProcedure();
