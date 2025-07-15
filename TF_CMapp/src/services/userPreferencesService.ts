// src/services/userPreferencesService.ts
import certificateService from './certificateService';

export interface UserPreferences {
  activeDir: string;
  activeMode: string;
  activeTheme: string;
  activeLayout: string;
  isCardShadow: boolean;
  isLayout: string;
  isBorderRadius: number;
  isCollapse: string;
  isLanguage: string;
  // Add any future user preferences here
}

export interface UserPreferencesWithTimestamp extends UserPreferences {
  lastUpdated: string;
  username: string;
}

class UserPreferencesService {
  private static instance: UserPreferencesService;
  private currentUser: string | null = null;
  private readonly STORAGE_PREFIX = 'user_preferences_';
  private readonly FALLBACK_PREFERENCES_KEY = 'fallback_user_preferences';

  private constructor() {}

  public static getInstance(): UserPreferencesService {
    if (!UserPreferencesService.instance) {
      UserPreferencesService.instance = new UserPreferencesService();
    }
    return UserPreferencesService.instance;
  }

  /**
   * Initialize the service and get current user info
   */
  public async initialize(): Promise<void> {
    try {
      const user = await certificateService.getCurrentUser();
      this.currentUser = user?.username || null;
      console.log('UserPreferencesService initialized for user:', this.currentUser);
    } catch (error) {
      console.warn('Failed to get current user for preferences, using fallback:', error);
      this.currentUser = null;
    }
  }

  /**
   * Get storage key for current user
   */
  private getStorageKey(): string {
    if (this.currentUser) {
      return `${this.STORAGE_PREFIX}${this.currentUser}`;
    }
    return this.FALLBACK_PREFERENCES_KEY;
  }

  /**
   * Load user preferences from localStorage
   */
  public loadPreferences(): Partial<UserPreferences> {
    try {
      const storageKey = this.getStorageKey();
      const stored = localStorage.getItem(storageKey);
      
      if (stored) {
        const preferences: UserPreferencesWithTimestamp = JSON.parse(stored);
        console.log(`Loaded preferences for ${this.currentUser || 'fallback user'}:`, preferences);
        
        // Return preferences without metadata
        const { lastUpdated, username, ...userPrefs } = preferences;
        return userPrefs;
      }
    } catch (error) {
      console.error('Failed to load user preferences:', error);
    }
    
    return {};
  }

  /**
   * Save user preferences to localStorage
   */
  public savePreferences(preferences: UserPreferences): void {
    try {
      const storageKey = this.getStorageKey();
      const preferencesWithMetadata: UserPreferencesWithTimestamp = {
        ...preferences,
        lastUpdated: new Date().toISOString(),
        username: this.currentUser || 'unknown'
      };
      
      localStorage.setItem(storageKey, JSON.stringify(preferencesWithMetadata));
      console.log(`Saved preferences for ${this.currentUser || 'fallback user'}:`, preferences);
    } catch (error) {
      console.error('Failed to save user preferences:', error);
    }
  }

  /**
   * Clear preferences for current user
   */
  public clearPreferences(): void {
    try {
      const storageKey = this.getStorageKey();
      localStorage.removeItem(storageKey);
      console.log(`Cleared preferences for ${this.currentUser || 'fallback user'}`);
    } catch (error) {
      console.error('Failed to clear user preferences:', error);
    }
  }

  /**
   * Get all stored user preferences (for debugging)
   */
  public getAllStoredPreferences(): Record<string, UserPreferencesWithTimestamp> {
    const allPreferences: Record<string, UserPreferencesWithTimestamp> = {};
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith(this.STORAGE_PREFIX) || key === this.FALLBACK_PREFERENCES_KEY)) {
          const stored = localStorage.getItem(key);
          if (stored) {
            allPreferences[key] = JSON.parse(stored);
          }
        }
      }
    } catch (error) {
      console.error('Failed to get all stored preferences:', error);
    }
    
    return allPreferences;
  }

  /**
   * Get current user identifier
   */
  public getCurrentUser(): string | null {
    return this.currentUser;
  }

  /**
   * Migrate preferences from global storage to user-specific storage
   * This should be called once during the migration period
   */
  public migrateGlobalPreferences(): void {
    try {
      // Check if there are any old global preferences to migrate
      const oldKeys = [
        'activeDir', 'activeMode', 'activeTheme', 'activeLayout',
        'isCardShadow', 'isLayout', 'isBorderRadius', 'isCollapse', 'isLanguage'
      ];
      
      const globalPrefs: Partial<UserPreferences> = {};
      let hasGlobalPrefs = false;
      
      oldKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value !== null) {
          try {
            (globalPrefs as any)[key] = JSON.parse(value);
            hasGlobalPrefs = true;
          } catch {
            (globalPrefs as any)[key] = value;
            hasGlobalPrefs = true;
          }
        }
      });
      
      if (hasGlobalPrefs && this.currentUser) {
        console.log('Migrating global preferences to user-specific storage:', globalPrefs);
        
        // Convert to UserPreferences format with defaults
        const userPrefs: UserPreferences = {
          activeDir: globalPrefs.activeDir || 'ltr',
          activeMode: globalPrefs.activeMode || 'light',
          activeTheme: globalPrefs.activeTheme || 'BLUE_THEME',
          activeLayout: globalPrefs.activeLayout || 'vertical',
          isCardShadow: globalPrefs.isCardShadow ?? true,
          isLayout: globalPrefs.isLayout || 'boxed',
          isBorderRadius: globalPrefs.isBorderRadius || 7,
          isCollapse: globalPrefs.isCollapse || 'full-sidebar',
          isLanguage: globalPrefs.isLanguage || 'en'
        };
        
        this.savePreferences(userPrefs);
        
        // Clean up old global preferences
        oldKeys.forEach(key => localStorage.removeItem(key));
        console.log('Migration completed and old global preferences cleaned up');
      }
    } catch (error) {
      console.error('Failed to migrate global preferences:', error);
    }
  }
}

// Export singleton instance
export const userPreferencesService = UserPreferencesService.getInstance();
