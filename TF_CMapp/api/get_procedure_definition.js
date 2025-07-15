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

async function getProcedureDefinition() {
  try {
    const pool = await sql.connect(config);
    
    const result = await pool.request().query(`
      SELECT definition 
      FROM sys.sql_modules 
      WHERE object_id = OBJECT_ID('usp_SaveInventoryItem')
    `);
    
    console.log('Stored procedure definition:');
    console.log(result.recordset[0].definition);
    
    await sql.close();
  } catch (err) {
    console.error('Error:', err);
    await sql.close();
  }
}

getProcedureDefinition();
