// src/services/projectService.ts
import { Project } from 'src/types/Project'; // <--- IMPORT Project interface

// Define mockProjects here, using the imported Project type
const mockProjects: Project[] = [
  { id: 'proj1', name: 'Project Alpha', productionOrderQty: 150, currentProgress: 60, dueDate: '2025-07-15', status: 'On Track' },
  { id: 'proj2', name: 'Project Beta', productionOrderQty: 75, currentProgress: 30, dueDate: '2025-08-01', status: 'At Risk' },
  { id: 'proj3', name: 'Project Charlie', productionOrderQty: 200, currentProgress: 95, dueDate: '2025-06-20', status: 'On Track' },
  { id: 'proj4', name: 'Project Delta', productionOrderQty: 100, currentProgress: 15, dueDate: '2025-09-10', status: 'Delayed' },
  { id: 'proj5', name: 'Project Epsilon', productionOrderQty: 250, currentProgress: 70, dueDate: '2025-07-30', status: 'On Track' },
  { id: 'proj6', name: 'Project Zeta', productionOrderQty: 50, currentProgress: 100, dueDate: '2025-05-30', status: 'Completed' },
];

// DELETE any duplicate "interface Project { ... }" definition from this file.

export const fetchProjectsAPI = async (): Promise<Project[]> => {
  console.log('Fetching projects (mock API in projectService)...');
  await new Promise(resolve => setTimeout(resolve, 700));
  return mockProjects;
};

export const fetchProjectByIdAPI = async (projectId: string): Promise<Project | undefined> => {
    console.log(`Workspaceing project ${projectId} (mock API in projectService)...`);
    await new Promise(resolve => setTimeout(resolve, 500));
    const project = mockProjects.find(p => p.id === projectId);
    if (!project) {
        console.warn(`Mock API: Project with ID ${projectId} not found.`);
        return undefined;
    }
    return project;
};

export const addProjectAPI = async (newProjectData: Omit<Project, 'id'>): Promise<Project> => {
  console.log('Adding new project (mock API in projectService)...', newProjectData);
  await new Promise(resolve => setTimeout(resolve, 500));
  const newProject: Project = {
    id: `proj${Math.floor(Math.random() * 1000) + 7}`,
    ...newProjectData,
  };
  mockProjects.push(newProject);
  return newProject;
};

export const updateProjectAPI = async (projectId: string, updatedProjectData: Partial<Omit<Project, 'id'>>): Promise<Project> => {
  console.log(`Updating project ${projectId} (mock API in projectService)...`, updatedProjectData);
  await new Promise(resolve => setTimeout(resolve, 500));
  const projectIndex = mockProjects.findIndex(p => p.id === projectId);
  if (projectIndex === -1) {
    throw new Error(`Mock API: Project with ID ${projectId} not found for update.`);
  }
  mockProjects[projectIndex] = { ...mockProjects[projectIndex], ...updatedProjectData };
  return mockProjects[projectIndex];
};

export const deleteProjectAPI = async (projectId: string): Promise<void> => {
  console.log(`Deleting project ${projectId} (mock API in projectService)...`);
  await new Promise(resolve => setTimeout(resolve, 500));
  const projectIndex = mockProjects.findIndex(p => p.id === projectId);
  if (projectIndex === -1) {
    throw new Error(`Mock API: Project with ID ${projectId} not found for deletion.`);
  }
  mockProjects.splice(projectIndex, 1);
  return;
};