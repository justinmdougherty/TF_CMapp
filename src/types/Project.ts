// src/types/project.ts
export interface Project {
  id: string;
  name: string;
  productionOrderQty: number;
  currentProgress: number; // Percentage 0-100
  dueDate: string; // YYYY-MM-DD format
  status: 'On Track' | 'At Risk' | 'Delayed' | 'Completed';
}

// DO NOT define mockProjects array here.