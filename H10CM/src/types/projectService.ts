import { Project } from 'src/types/Project';

const mockProjects: Project[] = [
  {
    project_id: 1,
    project_name: 'PR',
    project_description: 'Production Run Project',
    project_type: 'PR',
    status: 'Active',
    date_created: '2024-01-01T10:00:00Z',
    last_modified: '2024-06-20T14:30:00Z',
  },
  {
    project_id: 2,
    project_name: 'Assembly Line A',
    project_description: 'Assembly of Product A',
    project_type: 'ASSEMBLY',
    status: 'Development',
    date_created: '2024-02-15T09:00:00Z',
    last_modified: '2024-06-18T11:00:00Z',
  },
  {
    project_id: 3,
    project_name: 'Quality Control B',
    project_description: 'Quality checks for Product B',
    project_type: 'QC',
    status: 'Completed',
    date_created: '2023-11-01T08:00:00Z',
    last_modified: '2024-03-10T16:00:00Z',
  },
];

export const fetchProjectsAPI = async (): Promise<Project[]> => {
  console.log('Fetching projects (mock API in projectService)...');
  await new Promise(resolve => setTimeout(resolve, 700));
  return mockProjects;
};

export const fetchProjectByIdAPI = async (projectId: string): Promise<Project | undefined> => {
    console.log(`Fetching project ${projectId} (mock API in projectService)...`);
    await new Promise(resolve => setTimeout(resolve, 500));
    const project = mockProjects.find(p => p.project_id.toString() === projectId);
    if (!project) {
        console.warn(`Mock API: Project with ID ${projectId} not found.`);
        return undefined;
    }
    return project;
};

export const addProjectAPI = async (newProjectData: Omit<Project, 'project_id' | 'date_created' | 'last_modified'>): Promise<Project> => {
  console.log('Adding new project (mock API in projectService)...', newProjectData);
  await new Promise(resolve => setTimeout(resolve, 500));
  const newProject: Project = {
    project_id: mockProjects.length > 0 ? Math.max(...mockProjects.map(p => p.project_id)) + 1 : 1,
    date_created: new Date().toISOString(),
    last_modified: new Date().toISOString(),
    ...newProjectData,
  };
  mockProjects.push(newProject);
  return newProject;
};

export const updateProjectAPI = async (projectId: string, updatedProjectData: Partial<Omit<Project, 'project_id' | 'date_created'>>): Promise<Project> => {
  console.log(`Updating project ${projectId} (mock API in projectService)...`, updatedProjectData);
  await new Promise(resolve => setTimeout(resolve, 500));
  const projectIndex = mockProjects.findIndex(p => p.project_id.toString() === projectId);
  if (projectIndex === -1) {
    throw new Error(`Mock API: Project with ID ${projectId} not found for update.`);
  }
  mockProjects[projectIndex] = { ...mockProjects[projectIndex], ...updatedProjectData, last_modified: new Date().toISOString() };
  return mockProjects[projectIndex];
};

export const deleteProjectAPI = async (projectId: string): Promise<void> => {
  console.log(`Deleting project ${projectId} (mock API in projectService)...`);
  await new Promise(resolve => setTimeout(resolve, 500));
  const projectIndex = mockProjects.findIndex(p => p.project_id.toString() === projectId);
  if (projectIndex === -1) {
    throw new Error(`Mock API: Project with ID ${projectId} not found for deletion.`);
  }
  mockProjects.splice(projectIndex, 1);
  return;
};