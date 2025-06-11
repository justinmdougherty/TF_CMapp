import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';

import projectRoutes from './routes/projectRoutes.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ message: 'API is running' });
});

app.use('/projects', projectRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
