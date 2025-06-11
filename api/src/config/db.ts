import dotenv from 'dotenv';
import sql from 'mssql';

dotenv.config();

const dbConfig: sql.config = {
  user: process.env.DB_USER as string,
  password: process.env.DB_PASSWORD as string,
  server: process.env.DB_SERVER as string,
  database: process.env.DB_DATABASE as string,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 1433,
  options: {
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true'
  }
};

export const poolPromise = new sql.ConnectionPool(dbConfig)
  .connect()
  .then(pool => {
    console.log('Connected to MSSQL');
    return pool;
  })
  .catch(err => {
    console.error('Database connection failed', err);
    throw err;
  });

export { sql };
