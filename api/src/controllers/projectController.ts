import { Request, Response } from 'express';
import { poolPromise, sql } from '../config/db.js';

export const getAllProjects = async (_req: Request, res: Response) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM Projects');
    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching projects', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getProjectById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query('SELECT * FROM Projects WHERE project_id = @id');

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error fetching project', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
