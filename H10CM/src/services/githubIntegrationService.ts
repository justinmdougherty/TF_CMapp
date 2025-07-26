// GitHub Integration Service for Automatic Issue Generation
// This service handles automatic creation of GitHub issues based on errors and debug data

import { debugService } from './debugService';
import { toast } from 'react-hot-toast';

export interface GitHubIssueData {
  title: string;
  body: string;
  labels: string[];
  assignees?: string[];
  milestone?: string | number;
}

export interface ErrorContext {
  message: string;
  stack?: string;
  url?: string;
  userAgent?: string;
  timestamp: string;
  userId?: string;
  username?: string;
  sessionId?: string;
  component?: string;
  debugSettings: any;
  apiEndpoint?: string;
  requestData?: any;
  responseData?: any;
  httpStatus?: number;
  errorType: 'frontend' | 'api' | 'database' | 'network' | 'permission';
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'bug' | 'performance' | 'security' | 'enhancement';
  additionalContext?: Record<string, any>;
}

export interface GitHubConfig {
  enabled: boolean;
  owner: string;
  repo: string;
  token?: string; // Will be handled securely on backend
  autoCreateIssues: boolean;
  autoReporting?: boolean; // Alias for autoCreateIssues for UI compatibility
  minimumSeverity: 'low' | 'medium' | 'high' | 'critical';
  duplicateDetectionEnabled: boolean;
  includeSystemInfo: boolean;
  includeUserContext: boolean;
}

class GitHubIntegrationService {
  private static instance: GitHubIntegrationService;
  private config: GitHubConfig;
  private readonly STORAGE_KEY = 'h10cm-github-config';
  private readonly API_BASE = '/api/admin/github';
  private errorHandler?: (event: ErrorEvent) => void;
  private rejectionHandler?: (event: PromiseRejectionEvent) => void;
  
  private constructor() {
    this.config = this.loadConfig();
  }

  public static getInstance(): GitHubIntegrationService {
    if (!GitHubIntegrationService.instance) {
      GitHubIntegrationService.instance = new GitHubIntegrationService();
    }
    return GitHubIntegrationService.instance;
  }

  private loadConfig(): GitHubConfig {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return { ...this.getDefaultConfig(), ...JSON.parse(stored) };
      }
    } catch (error) {
      console.warn('Failed to load GitHub config:', error);
    }
    return this.getDefaultConfig();
  }

  private getDefaultConfig(): GitHubConfig {
    return {
      enabled: false,
      owner: 'justinmdougherty',
      repo: 'H10CM',
      autoCreateIssues: false,
      minimumSeverity: 'medium',
      duplicateDetectionEnabled: true,
      includeSystemInfo: true,
      includeUserContext: true,
    };
  }

  private saveConfig(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.config));
    } catch (error) {
      console.warn('Failed to save GitHub config:', error);
    }
  }

  public getConfig(): GitHubConfig {
    return { ...this.config };
  }

  public updateConfig(updates: Partial<GitHubConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
  }

  public async testConnection(): Promise<{ success: boolean; message: string; rateLimitRemaining?: number }> {
    try {
      const response = await fetch(`${this.API_BASE}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.config),
      });

      const result = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          message: 'GitHub connection successful',
          rateLimitRemaining: result.rateLimitRemaining,
        };
      } else {
        return {
          success: false,
          message: result.error || 'Connection failed',
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  public async createIssueFromError(errorContext: ErrorContext): Promise<{ success: boolean; issueUrl?: string; message: string }> {
    if (!this.config.enabled || !this.config.autoCreateIssues) {
      return { success: false, message: 'GitHub integration disabled' };
    }

    if (!this.meetsSeverityThreshold(errorContext.severity)) {
      return { success: false, message: 'Error severity below threshold' };
    }

    try {
      const issueData = this.generateIssueFromError(errorContext);
      
      const response = await fetch(`${this.API_BASE}/create-issue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: this.config,
          issueData,
          errorContext,
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        // Show different notifications for automatic vs manual issue creation
        const isAutomaticIssue = errorContext.additionalContext?.autoReported === true;
        
        if (isAutomaticIssue) {
          // Enhanced notification for automatic issues with context
          const { notifications } = await import('./notificationService');
          notifications.automaticErrorReportWithContext(
            result.issueNumber,
            errorContext.errorType,
            errorContext.severity,
            errorContext.username
          );
          console.log(`✅ Automatic GitHub issue created: #${result.issueNumber} for ${errorContext.errorType} error by ${errorContext.username || 'unknown user'}`);
        } else {
          // Standard notification for manual issues
          toast.success(`GitHub issue created: #${result.issueNumber}`);
        }
        
        return {
          success: true,
          issueUrl: result.issueUrl,
          message: `Issue #${result.issueNumber} created successfully`,
        };
      } else {
        return {
          success: false,
          message: result.error || 'Failed to create issue',
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Issue creation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  public async createManualIssue(title: string, description: string, labels: string[] = [], severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'): Promise<{ success: boolean; issueUrl?: string; message: string }> {
    if (!this.config.enabled) {
      return { success: false, message: 'GitHub integration disabled' };
    }

    try {
      const issueData: GitHubIssueData = {
        title: `[MANUAL] ${title}`,
        body: this.formatManualIssueBody(description, severity),
        labels: [...labels, 'manual', `severity:${severity}`],
      };

      const response = await fetch(`${this.API_BASE}/create-issue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: this.config,
          issueData,
          isManual: true,
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        toast.success(`Manual GitHub issue created: #${result.issueNumber}`);
        return {
          success: true,
          issueUrl: result.issueUrl,
          message: `Issue #${result.issueNumber} created successfully`,
        };
      } else {
        return {
          success: false,
          message: result.error || 'Failed to create manual issue',
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Manual issue creation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  private meetsSeverityThreshold(severity: 'low' | 'medium' | 'high' | 'critical'): boolean {
    const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 };
    return severityLevels[severity] >= severityLevels[this.config.minimumSeverity];
  }

  private generateIssueFromError(errorContext: ErrorContext): GitHubIssueData {
    const title = this.generateIssueTitle(errorContext);
    const body = this.generateIssueBody(errorContext);
    const labels = this.generateIssueLabels(errorContext);

    return { title, body, labels };
  }

  private generateIssueTitle(errorContext: ErrorContext): string {
    const { errorType, severity, message } = errorContext;
    
    // Extract meaningful error title
    let shortMessage = message.split('\n')[0].substring(0, 80);
    if (shortMessage.length < message.length) {
      shortMessage += '...';
    }

    return `[${errorType.toUpperCase()}][${severity.toUpperCase()}] ${shortMessage}`;
  }

  private generateIssueBody(errorContext: ErrorContext): string {
    const sections = [];

    // Error Summary
    sections.push('## Error Summary');
    sections.push(`**Type:** ${errorContext.errorType}`);
    sections.push(`**Severity:** ${errorContext.severity}`);
    sections.push(`**Category:** ${errorContext.category}`);
    sections.push(`**Timestamp:** ${errorContext.timestamp}`);
    sections.push('');

    // Error Details
    sections.push('## Error Details');
    sections.push('```');
    sections.push(errorContext.message);
    sections.push('```');
    sections.push('');

    // Stack Trace (if available)
    if (errorContext.stack) {
      sections.push('## Stack Trace');
      sections.push('<details>');
      sections.push('<summary>Click to expand stack trace</summary>');
      sections.push('');
      sections.push('```');
      sections.push(errorContext.stack);
      sections.push('```');
      sections.push('</details>');
      sections.push('');
    }

    // API Context (if available)
    if (errorContext.apiEndpoint) {
      sections.push('## API Context');
      sections.push(`**Endpoint:** ${errorContext.apiEndpoint}`);
      if (errorContext.httpStatus) {
        sections.push(`**HTTP Status:** ${errorContext.httpStatus}`);
      }
      if (errorContext.requestData) {
        sections.push('**Request Data:**');
        sections.push('```json');
        sections.push(JSON.stringify(errorContext.requestData, null, 2));
        sections.push('```');
      }
      if (errorContext.responseData) {
        sections.push('**Response Data:**');
        sections.push('```json');
        sections.push(JSON.stringify(errorContext.responseData, null, 2));
        sections.push('```');
      }
      sections.push('');
    }

    // User Context (if enabled and available)
    if (this.config.includeUserContext && errorContext.username) {
      sections.push('## User Context');
      sections.push(`**User:** ${errorContext.username} (ID: ${errorContext.userId})`);
      if (errorContext.sessionId) {
        sections.push(`**Session ID:** ${errorContext.sessionId}`);
      }
      sections.push('');
    }

    // System Information (if enabled)
    if (this.config.includeSystemInfo) {
      sections.push('## System Information');
      if (errorContext.url) {
        sections.push(`**URL:** ${errorContext.url}`);
      }
      if (errorContext.userAgent) {
        sections.push(`**User Agent:** ${errorContext.userAgent}`);
      }
      sections.push(`**Debug Mode:** ${errorContext.debugSettings?.enabled ? 'Enabled' : 'Disabled'}`);
      sections.push('');
    }

    // Debug Settings
    if (errorContext.debugSettings) {
      sections.push('## Debug Settings');
      sections.push('<details>');
      sections.push('<summary>Click to expand debug configuration</summary>');
      sections.push('');
      sections.push('```json');
      sections.push(JSON.stringify(errorContext.debugSettings, null, 2));
      sections.push('```');
      sections.push('</details>');
      sections.push('');
    }

    // Auto-generated notice
    sections.push('---');
    sections.push('*This issue was automatically generated by the H10CM Debug Control Panel*');

    return sections.join('\n');
  }

  private generateIssueLabels(errorContext: ErrorContext): string[] {
    const labels = [
      'auto-generated',
      `type:${errorContext.errorType}`,
      `severity:${errorContext.severity}`,
      `category:${errorContext.category}`,
    ];

    // Add specific labels based on error type
    switch (errorContext.errorType) {
      case 'database':
        labels.push('database', 'backend');
        break;
      case 'api':
        labels.push('api', 'backend');
        break;
      case 'frontend':
        labels.push('frontend', 'ui');
        break;
      case 'network':
        labels.push('network', 'connectivity');
        break;
      case 'permission':
        labels.push('security', 'rbac');
        break;
    }

    // Add severity-based labels
    if (errorContext.severity === 'critical') {
      labels.push('priority:high', 'needs-immediate-attention');
    } else if (errorContext.severity === 'high') {
      labels.push('priority:medium');
    }

    return labels;
  }

  private formatManualIssueBody(description: string, severity: 'low' | 'medium' | 'high' | 'critical'): string {
    const sections = [];

    sections.push('## Manual Issue Report');
    sections.push(`**Severity:** ${severity}`);
    sections.push(`**Reported:** ${new Date().toISOString()}`);
    sections.push('');

    sections.push('## Description');
    sections.push(description);
    sections.push('');

    sections.push('---');
    sections.push('*This issue was manually created via the H10CM Debug Control Panel*');

    return sections.join('\n');
  }

  // Error capture helper methods
  public captureError(error: any, context: Partial<ErrorContext> = {}): ErrorContext {
    const errorContext: ErrorContext = {
      message: error?.message || String(error),
      stack: error?.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      debugSettings: debugService.getDebugSettings(),
      errorType: context.errorType || 'frontend',
      severity: context.severity || 'medium',
      category: context.category || 'bug',
      ...context,
    };

    // Auto-detect error type if not specified
    if (!context.errorType) {
      errorContext.errorType = this.detectErrorType(error);
    }

    // Auto-detect severity if not specified
    if (!context.severity) {
      errorContext.severity = this.detectSeverity(error);
    }

    return errorContext;
  }

  private detectErrorType(error: any): 'frontend' | 'api' | 'database' | 'network' | 'permission' {
    const message = error?.message?.toLowerCase() || '';

    if (message.includes('network') || message.includes('fetch') || error?.code === 'NETWORK_ERROR') {
      return 'network';
    }
    
    if (message.includes('sql') || message.includes('database') || message.includes('connection')) {
      return 'database';
    }
    
    if (message.includes('permission') || message.includes('unauthorized') || message.includes('forbidden')) {
      return 'permission';
    }
    
    if (message.includes('api') || message.includes('endpoint') || error?.response) {
      return 'api';
    }

    return 'frontend';
  }

  private detectSeverity(error: any): 'low' | 'medium' | 'high' | 'critical' {
    const message = error?.message?.toLowerCase() || '';
    const status = error?.response?.status;

    // Critical errors
    if (message.includes('crash') || message.includes('fatal') || status === 500) {
      return 'critical';
    }

    // High severity errors
    if (message.includes('security') || message.includes('unauthorized') || 
        status === 401 || status === 403 || message.includes('corruption')) {
      return 'high';
    }

    // Low severity errors
    if (message.includes('warning') || status === 404 || message.includes('deprecated')) {
      return 'low';
    }

    // Default to medium
    return 'medium';
  }

  // Automatic error monitoring
  public enableAutoErrorCapture(userContext?: { userId: string; username: string; sessionId?: string }): void {
    // Remove existing listeners to avoid duplicates
    this.disableAutoErrorCapture();

    // Create error handler functions that we can reference for removal
    this.errorHandler = (event) => {
      const errorContext = this.captureError(event.error, {
        errorType: 'frontend',
        userId: userContext?.userId,
        username: userContext?.username,
        sessionId: userContext?.sessionId,
        additionalContext: {
          autoReported: true,
          captureMethod: 'window.error',
          automatic: true,
        },
      });

      if (this.config.autoCreateIssues) {
        this.createIssueFromError(errorContext);
      }
    };

    this.rejectionHandler = (event) => {
      const errorContext = this.captureError(event.reason, {
        errorType: 'frontend',
        userId: userContext?.userId,
        username: userContext?.username,
        sessionId: userContext?.sessionId,
        additionalContext: {
          autoReported: true,
          captureMethod: 'unhandledrejection',
          automatic: true,
        },
      });

      if (this.config.autoCreateIssues) {
        this.createIssueFromError(errorContext);
      }
    };

    // Capture unhandled errors
    window.addEventListener('error', this.errorHandler);

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', this.rejectionHandler);

    console.log('✅ GitHub auto error capture enabled', userContext ? `for user: ${userContext.username}` : '');
  }

  // Method to create an error issue directly
  async createErrorIssue(errorContext: ErrorContext): Promise<any> {
    try {
      const issueData = this.generateIssueFromError(errorContext);
      const response = await fetch('/api/admin/github/create-issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          config: {
            owner: this.config.owner,
            repo: this.config.repo,
            duplicateDetectionEnabled: this.config.duplicateDetectionEnabled
          },
          issueData: issueData,
          errorContext: errorContext,
          isManual: false
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create issue: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to create error issue:', error);
      throw error;
    }
  }

  // Method to get recent issues
  async getRecentIssues(): Promise<any[]> {
    try {
      const response = await fetch('/api/admin/github/issues?limit=10', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch issues: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get recent issues:', error);
      return [];
    }
  }

  // Method to disable auto error capture
  disableAutoErrorCapture(): void {
    // Remove event listeners if they exist
    if (this.errorHandler) {
      window.removeEventListener('error', this.errorHandler);
      this.errorHandler = undefined;
    }
    if (this.rejectionHandler) {
      window.removeEventListener('unhandledrejection', this.rejectionHandler);
      this.rejectionHandler = undefined;
    }
    
    // Update config
    this.updateConfig({ autoCreateIssues: false, autoReporting: false });
    console.log('✅ GitHub auto error capture disabled');
  }
}

// Export singleton instance
export const githubIntegrationService = GitHubIntegrationService.getInstance();

// Export for React hooks
export const useGitHubIntegration = () => {
  return githubIntegrationService;
};
