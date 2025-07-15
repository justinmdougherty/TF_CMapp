// Production Task Generation Service
// Automatically generates tasks based on production data and project progress

import { TaskItem, TaskPriority, TaskCategory } from 'src/types/Task';
import { UserProfile } from 'src/types/UserPermissions';

export interface ProductionTaskSource {
  source_type: 'production_step' | 'quality_inspection' | 'inventory_shortage' | 'maintenance_due' | 'shipping_ready';
  source_id: string; // tracked_item_id, project_id, inventory_id, etc.
  project_id?: string;
  unit_id?: string;
  step_id?: string;
  priority_multiplier: number; // 1.0 = normal, 1.5 = high priority, 2.0 = critical
}

export interface ProductionTask extends Omit<TaskItem, 'task_id' | 'created_date' | 'assigned_by'> {
  task_id: string;
  source: ProductionTaskSource;
  auto_generated: boolean;
  estimated_completion_time: number; // in minutes
  required_skills: string[];
  location?: string; // Work station, area, etc.
  dependencies?: string[]; // Other task IDs that must be completed first
  can_be_reassigned: boolean;
  created_date: Date;
  updated_date: Date;
  assigned_by: 'system' | string; // 'system' for auto-generated, user_id for manual
}

export interface ProductionTaskGenerationConfig {
  enabled: boolean;
  generation_interval_minutes: number; // How often to scan for new tasks
  auto_assign_tasks: boolean; // Automatically assign to available technicians
  priority_thresholds: {
    overdue_multiplier: number; // Multiply priority for overdue items
    critical_project_multiplier: number; // For high-priority projects
    quality_issue_multiplier: number; // For quality-related tasks
  };
  skill_matching: {
    require_exact_match: boolean;
    allow_skill_substitution: boolean;
    prefer_experienced_technicians: boolean;
  };
}

export class ProductionTaskGenerator {
  private config: ProductionTaskGenerationConfig;

  constructor(config: ProductionTaskGenerationConfig) {
    this.config = config;
  }

  /**
   * Scans all production data and generates tasks for work that needs to be done
   */
  async generateProductionTasks(
    trackedItems: any[], 
    projectSteps: any[], 
    projects: any[],
    availableTechnicians: UserProfile[]
  ): Promise<ProductionTask[]> {
    const tasks: ProductionTask[] = [];

    // Generate tasks for incomplete production steps
    const stepTasks = await this.generateStepCompletionTasks(trackedItems, projectSteps, projects);
    tasks.push(...stepTasks);

    // Generate tasks for quality inspections
    const qualityTasks = await this.generateQualityInspectionTasks(trackedItems, projects);
    tasks.push(...qualityTasks);

    // Generate tasks for shipping preparation
    const shippingTasks = await this.generateShippingPreparationTasks(trackedItems, projects);
    tasks.push(...shippingTasks);

    // Generate tasks for maintenance requirements
    const maintenanceTasks = await this.generateMaintenanceTasks();
    tasks.push(...maintenanceTasks);

    // Auto-assign tasks if enabled
    if (this.config.auto_assign_tasks) {
      await this.autoAssignTasks(tasks, availableTechnicians);
    }

    return tasks;
  }

  /**
   * Generate tasks for production steps that need to be completed
   */
  private async generateStepCompletionTasks(
    trackedItems: any[], 
    projectSteps: any[], 
    projects: any[]
  ): Promise<ProductionTask[]> {
    const tasks: ProductionTask[] = [];

    for (const item of trackedItems) {
      if (item.is_shipped) continue; // Skip shipped items

      const project = projects.find(p => p.project_id === item.project_id);
      if (!project) continue;

      const itemSteps = item.step_statuses || [];
      
      for (const projectStep of projectSteps) {
        const stepStatus = itemSteps.find((s: any) => s.step_id === projectStep.step_id);
        
        // If step is not completed, create a task
        if (!stepStatus || stepStatus.status !== 'Complete') {
          const isOverdue = stepStatus?.target_completion_date && 
                           new Date(stepStatus.target_completion_date) < new Date();
          
          const priority = this.calculateStepPriority(projectStep, project, isOverdue);
          
          const task: ProductionTask = {
            task_id: `prod_step_${item.tracked_item_id}_${projectStep.step_id}`,
            title: `${projectStep.step_name} - Unit ${item.tracked_item_id}`,
            description: `Complete ${projectStep.step_name} for unit ${item.tracked_item_id} on project ${project.project_name}`,
            status: 'Pending',
            priority: priority,
            category: this.mapStepToCategory(projectStep.step_name),
            assigned_to: stepStatus?.assigned_to || '',
            project_id: project.project_id.toString(),
            due_date: stepStatus?.target_completion_date ? new Date(stepStatus.target_completion_date) : undefined,
            estimated_hours: projectStep.estimated_time_hours || 1,
            source: {
              source_type: 'production_step',
              source_id: item.tracked_item_id,
              project_id: project.project_id.toString(),
              unit_id: item.tracked_item_id,
              step_id: projectStep.step_id,
              priority_multiplier: isOverdue ? this.config.priority_thresholds.overdue_multiplier : 1.0
            },
            auto_generated: true,
            estimated_completion_time: (projectStep.estimated_time_hours || 1) * 60,
            required_skills: this.getRequiredSkillsForStep(projectStep),
            location: projectStep.work_station || projectStep.department,
            dependencies: this.getStepDependencies(projectStep, itemSteps),
            can_be_reassigned: true,
            created_date: new Date(),
            updated_date: new Date(),
            assigned_by: 'system',
            notes: `Auto-generated task for production step. Unit: ${item.tracked_item_id}, Step: ${projectStep.step_name}`
          };

          tasks.push(task);
        }
      }
    }

    return tasks;
  }

  /**
   * Generate tasks for quality inspections
   */
  private async generateQualityInspectionTasks(trackedItems: any[], projects: any[]): Promise<ProductionTask[]> {
    const tasks: ProductionTask[] = [];

    for (const item of trackedItems) {
      if (item.is_shipped) continue;

      const project = projects.find(p => p.project_id === item.project_id);
      if (!project) continue;

      // Check if item needs quality inspection
      if (this.needsQualityInspection(item)) {
        const task: ProductionTask = {
          task_id: `quality_${item.tracked_item_id}`,
          title: `Quality Inspection - Unit ${item.tracked_item_id}`,
          description: `Perform quality inspection for unit ${item.tracked_item_id} on project ${project.project_name}`,
          status: 'Pending',
          priority: 'High' as TaskPriority,
          category: 'Quality' as TaskCategory,
          assigned_to: '', // Will be assigned to quality inspector
          project_id: project.project_id.toString(),
          source: {
            source_type: 'quality_inspection',
            source_id: item.tracked_item_id,
            project_id: project.project_id.toString(),
            unit_id: item.tracked_item_id,
            priority_multiplier: this.config.priority_thresholds.quality_issue_multiplier
          },
          auto_generated: true,
          estimated_completion_time: 30, // 30 minutes for inspection
          required_skills: ['Quality Control', 'Inspection'],
          can_be_reassigned: true,
          created_date: new Date(),
          updated_date: new Date(),
          assigned_by: 'system',
          notes: 'Auto-generated quality inspection task'
        };

        tasks.push(task);
      }
    }

    return tasks;
  }

  /**
   * Generate tasks for items ready for shipping
   */
  private async generateShippingPreparationTasks(trackedItems: any[], projects: any[]): Promise<ProductionTask[]> {
    const tasks: ProductionTask[] = [];

    for (const item of trackedItems) {
      if (item.is_shipped) continue;

      const project = projects.find(p => p.project_id === item.project_id);
      if (!project) continue;

      // Check if all steps are complete and ready for shipping
      if (this.isReadyForShipping(item)) {
        const task: ProductionTask = {
          task_id: `shipping_${item.tracked_item_id}`,
          title: `Prepare for Shipping - Unit ${item.tracked_item_id}`,
          description: `Prepare unit ${item.tracked_item_id} for shipping - packaging, documentation, and final checks`,
          status: 'Pending',
          priority: 'Medium' as TaskPriority,
          category: 'General' as TaskCategory,
          assigned_to: '',
          project_id: project.project_id.toString(),
          source: {
            source_type: 'shipping_ready',
            source_id: item.tracked_item_id,
            project_id: project.project_id.toString(),
            unit_id: item.tracked_item_id,
            priority_multiplier: 1.0
          },
          auto_generated: true,
          estimated_completion_time: 60, // 1 hour for shipping prep
          required_skills: ['Packaging', 'Shipping'],
          can_be_reassigned: true,
          created_date: new Date(),
          updated_date: new Date(),
          assigned_by: 'system',
          notes: 'Auto-generated shipping preparation task'
        };

        tasks.push(task);
      }
    }

    return tasks;
  }

  /**
   * Generate maintenance tasks (placeholder for equipment maintenance)
   */
  private async generateMaintenanceTasks(): Promise<ProductionTask[]> {
    // This would integrate with equipment maintenance schedules
    // For now, return empty array
    return [];
  }

  /**
   * Auto-assign tasks to available technicians based on skills and workload
   */
  private async autoAssignTasks(tasks: ProductionTask[], technicians: UserProfile[]): Promise<void> {
    for (const task of tasks) {
      if (task.assigned_to) continue; // Already assigned

      const suitableTechnician = this.findBestTechnician(task, technicians);
      if (suitableTechnician) {
        task.assigned_to = suitableTechnician.user_id;
      }
    }
  }

  // Helper methods
  private calculateStepPriority(step: any, project: any, isOverdue: boolean): TaskPriority {
    let basePriority: TaskPriority = 'Medium';
    
    if (project.status === 'Active' && project.priority === 'High') {
      basePriority = 'High';
    }
    
    if (isOverdue) {
      basePriority = 'Critical';
    }
    
    return basePriority;
  }

  private mapStepToCategory(stepName: string): TaskCategory {
    const stepLower = stepName.toLowerCase();
    
    if (stepLower.includes('weld') || stepLower.includes('assembly') || stepLower.includes('machining')) {
      return 'Production';
    }
    if (stepLower.includes('inspect') || stepLower.includes('quality') || stepLower.includes('test')) {
      return 'Quality';
    }
    if (stepLower.includes('plan') || stepLower.includes('schedule')) {
      return 'Planning';
    }
    if (stepLower.includes('maintain') || stepLower.includes('repair')) {
      return 'Maintenance';
    }
    
    return 'General';
  }

  private getRequiredSkillsForStep(step: any): string[] {
    // This would be configured based on step types
    const stepName = step.step_name.toLowerCase();
    const skills: string[] = [];
    
    if (stepName.includes('weld')) skills.push('Welding');
    if (stepName.includes('machine')) skills.push('Machining');
    if (stepName.includes('assembly')) skills.push('Assembly');
    if (stepName.includes('inspect')) skills.push('Quality Control');
    if (stepName.includes('paint')) skills.push('Painting');
    
    return skills.length > 0 ? skills : ['General Production'];
  }

  private getStepDependencies(currentStep: any, itemSteps: any[]): string[] {
    // Logic to determine which other tasks must be completed first
    // This would be based on step sequence and dependencies
    return [];
  }

  private needsQualityInspection(item: any): boolean {
    // Logic to determine if item needs quality inspection
    // Could be based on step completion, time since last inspection, etc.
    const stepStatuses = item.step_statuses || [];
    const hasCompletedProductionSteps = stepStatuses.some(s => 
      s.status === 'Complete' && s.step_name?.toLowerCase().includes('production')
    );
    
    return hasCompletedProductionSteps && !item.quality_checked;
  }

  private isReadyForShipping(item: any): boolean {
    // Check if all required steps are complete
    const stepStatuses = item.step_statuses || [];
    const hasIncompleteSteps = stepStatuses.some(s => s.status !== 'Complete');
    
    return !hasIncompleteSteps && item.quality_checked && !item.shipping_prepared;
  }

  private findBestTechnician(task: ProductionTask, technicians: UserProfile[]): UserProfile | null {
    // Find technician with required skills and lowest workload
    const suitableTechnicians = technicians.filter(tech => {
      // Check if technician has required skills
      const hasSkills = task.required_skills.length === 0 || 
                       task.required_skills.some(skill => tech.preferences?.skills?.includes(skill));
      
      // Check if technician can be assigned tasks (not visitor role, etc.)
      const canBeAssigned = tech.role === 'Technician' || tech.role === 'ProjectManager';
      
      return hasSkills && canBeAssigned && tech.status === 'Active';
    });

    if (suitableTechnicians.length === 0) return null;

    // Sort by current workload (would need to get current task count)
    // For now, just return the first suitable technician
    return suitableTechnicians[0];
  }
}

// Default configuration
export const DEFAULT_PRODUCTION_TASK_CONFIG: ProductionTaskGenerationConfig = {
  enabled: true,
  generation_interval_minutes: 15, // Scan every 15 minutes
  auto_assign_tasks: true,
  priority_thresholds: {
    overdue_multiplier: 2.0,
    critical_project_multiplier: 1.5,
    quality_issue_multiplier: 1.8
  },
  skill_matching: {
    require_exact_match: false,
    allow_skill_substitution: true,
    prefer_experienced_technicians: true
  }
};
