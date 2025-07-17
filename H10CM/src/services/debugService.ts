// Debug/Development Mode Service
// This service manages debug mode state and provides utilities for debug logging

export interface DebugSettings {
  enabled: boolean;
  showErrorDetails: boolean;
  verboseLogging: boolean;
  showSqlErrors: boolean;
  showNetworkErrors: boolean;
  enableApiDebugHeaders: boolean;
  timestamp: string;
  enabledBy?: string;
}

class DebugService {
  private static instance: DebugService;
  private debugSettings: DebugSettings;
  private readonly STORAGE_KEY = 'h10cm-debug-settings';

  private constructor() {
    this.debugSettings = this.loadDebugSettings();
  }

  public static getInstance(): DebugService {
    if (!DebugService.instance) {
      DebugService.instance = new DebugService();
    }
    return DebugService.instance;
  }

  private loadDebugSettings(): DebugSettings {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load debug settings from localStorage:', error);
    }

    // Default debug settings
    return {
      enabled: process.env.NODE_ENV === 'development',
      showErrorDetails: false,
      verboseLogging: false,
      showSqlErrors: false,
      showNetworkErrors: false,
      enableApiDebugHeaders: false,
      timestamp: new Date().toISOString(),
    };
  }

  private saveDebugSettings(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.debugSettings));
    } catch (error) {
      console.warn('Failed to save debug settings to localStorage:', error);
    }
  }

  public getDebugSettings(): DebugSettings {
    return { ...this.debugSettings };
  }

  public updateDebugSettings(updates: Partial<DebugSettings>, enabledBy?: string): void {
    this.debugSettings = {
      ...this.debugSettings,
      ...updates,
      timestamp: new Date().toISOString(),
      enabledBy: enabledBy || this.debugSettings.enabledBy,
    };
    this.saveDebugSettings();
    
    // Notify API about debug mode change
    this.notifyApiOfDebugMode();
    
    console.log('Debug settings updated:', this.debugSettings);
  }

  public isDebugEnabled(): boolean {
    return this.debugSettings.enabled || process.env.NODE_ENV === 'development';
  }

  public shouldShowErrorDetails(): boolean {
    return this.isDebugEnabled() && this.debugSettings.showErrorDetails;
  }

  public shouldUseVerboseLogging(): boolean {
    return this.isDebugEnabled() && this.debugSettings.verboseLogging;
  }

  public shouldShowSqlErrors(): boolean {
    return this.isDebugEnabled() && this.debugSettings.showSqlErrors;
  }

  public shouldShowNetworkErrors(): boolean {
    return this.isDebugEnabled() && this.debugSettings.showNetworkErrors;
  }

  public shouldEnableApiDebugHeaders(): boolean {
    return this.isDebugEnabled() && this.debugSettings.enableApiDebugHeaders;
  }

  // Debug logging utilities
  public debugLog(message: string, data?: any): void {
    if (this.shouldUseVerboseLogging()) {
      console.log(`[H10CM DEBUG] ${message}`, data || '');
    }
  }

  public debugError(message: string, error?: any): void {
    if (this.shouldShowErrorDetails()) {
      console.error(`[H10CM DEBUG ERROR] ${message}`, error || '');
    }
  }

  public debugNetwork(message: string, data?: any): void {
    if (this.shouldShowNetworkErrors()) {
      console.log(`[H10CM NETWORK DEBUG] ${message}`, data || '');
    }
  }

  public debugSql(message: string, data?: any): void {
    if (this.shouldShowSqlErrors()) {
      console.log(`[H10CM SQL DEBUG] ${message}`, data || '');
    }
  }

  // Format error for display based on debug settings
  public formatError(error: any): { message: string; details?: string; technical?: any } {
    const baseMessage = this.getDisplayMessage(error);
    
    if (!this.shouldShowErrorDetails()) {
      return { message: baseMessage };
    }

    // Debug mode - show detailed information
    const details = this.extractErrorDetails(error);
    return {
      message: baseMessage,
      details: details.details,
      technical: details.technical,
    };
  }

  private getDisplayMessage(error: any): string {
    if (error?.response?.data?.error?.message) {
      return error.response.data.error.message;
    }
    
    const status = error?.response?.status;
    switch (status) {
      case 500:
        return "Cannot contact the server. Please try again in a moment.";
      case 404:
        return "The requested resource doesn't exist.";
      case 403:
        return "You don't have permission to perform this action.";
      case 401:
        return "Please log in to continue.";
      default:
        return "An unexpected error occurred. Please try again.";
    }
  }

  private extractErrorDetails(error: any): { details: string; technical: any } {
    const details = [];
    const technical: any = {};

    // Extract error message
    if (error?.message) {
      details.push(`Error: ${error.message}`);
      technical.message = error.message;
    }

    // Extract HTTP details
    if (error?.response) {
      details.push(`Status: ${error.response.status} ${error.response.statusText}`);
      details.push(`URL: ${error.response.config?.url}`);
      technical.response = {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers,
      };
    }

    // Extract stack trace
    if (error?.stack) {
      technical.stack = error.stack;
    }

    // Extract SQL errors
    if (error?.response?.data?.error?.detail) {
      details.push(`SQL Error: ${error.response.data.error.detail}`);
      technical.sqlError = error.response.data.error.detail;
    }

    // Extract network errors
    if (error?.code) {
      details.push(`Network Code: ${error.code}`);
      technical.networkCode = error.code;
    }

    return {
      details: details.join('\n'),
      technical,
    };
  }

  private async notifyApiOfDebugMode(): Promise<void> {
    try {
      // Send debug mode settings to API
      const response = await fetch('/api/admin/debug-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-debug-mode': this.isDebugEnabled().toString(),
        },
        body: JSON.stringify(this.debugSettings),
      });

      if (!response.ok) {
        console.warn('Failed to notify API of debug mode change');
      }
    } catch (error) {
      console.warn('Failed to notify API of debug mode change:', error);
    }
  }

  // Toggle debug mode quickly
  public toggleDebugMode(enabledBy?: string): boolean {
    const newState = !this.debugSettings.enabled;
    this.updateDebugSettings({ enabled: newState }, enabledBy);
    return newState;
  }

  // Reset to defaults
  public resetToDefaults(): void {
    const defaults: DebugSettings = {
      enabled: process.env.NODE_ENV === 'development',
      showErrorDetails: false,
      verboseLogging: false,
      showSqlErrors: false,
      showNetworkErrors: false,
      enableApiDebugHeaders: false,
      timestamp: new Date().toISOString(),
    };
    
    this.debugSettings = defaults;
    this.saveDebugSettings();
    this.notifyApiOfDebugMode();
  }
}

// Export singleton instance
export const debugService = DebugService.getInstance();

// Export for React hooks
export const useDebugService = () => {
  return debugService;
};

// Console override for debug mode
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

// Enhanced console logging in debug mode
console.log = (...args: any[]) => {
  originalConsoleLog(...args);
  if (debugService.shouldUseVerboseLogging()) {
    // Could send to remote logging service in the future
  }
};

console.error = (...args: any[]) => {
  originalConsoleError(...args);
  if (debugService.shouldShowErrorDetails()) {
    // Could send to remote error reporting service in the future
  }
};
