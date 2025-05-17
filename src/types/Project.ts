// src/types/project.ts/ 
export interface Project {
  id: string;
  name: string;
  productionOrderQty: number;
  currentProgress: number;
  dueDate: string;
  status: 'On Track' | 'At Risk' | 'Delayed' | 'Completed';
}

// DO NOT define mockProjects array here.