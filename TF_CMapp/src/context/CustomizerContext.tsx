import { createContext, useState, ReactNode, useEffect } from 'react';
import config from './config';
import React from 'react';
import { userPreferencesService, UserPreferences } from '../services/userPreferencesService';

// Define the shape of the context state
interface CustomizerContextState {
  activeDir: string;
  setActiveDir: (dir: string) => void;
  activeMode: string;
  setActiveMode: (mode: string) => void;
  activeTheme: string;
  setActiveTheme: (theme: string) => void;
  activeLayout: string;
  setActiveLayout: (layout: string) => void;
  isCardShadow: boolean;
  setIsCardShadow: (shadow: boolean) => void;
  isLayout: string;
  setIsLayout: (layout: string) => void;
  isBorderRadius: number;
  setIsBorderRadius: (radius: number) => void;
  isCollapse: string;
  setIsCollapse: (collapse: string) => void;
  isSidebarHover: boolean;
  setIsSidebarHover: (isHover: boolean) => void;
  isMobileSidebar: boolean;
  setIsMobileSidebar: (isMobileSidebar: boolean) => void;
  preferencesLoaded: boolean;
  currentUser: string | null;
  clearUserPreferences: () => void;
  resetToDefaults: () => void;
}

// Create the context with an initial value
export const CustomizerContext = createContext<CustomizerContextState | any>(undefined);

// Define the type for the children prop
interface CustomizerContextProps {
  children: ReactNode;
}
// Create the provider component
export const CustomizerContextProvider: React.FC<CustomizerContextProps> = ({ children }) => {
  const [activeDir, setActiveDir] = useState<string>(config.activeDir);
  const [activeMode, setActiveMode] = useState<string>(config.activeMode);
  const [activeTheme, setActiveTheme] = useState<string>(config.activeTheme);
  const [activeLayout, setActiveLayout] = useState<string>(config.activeLayout);
  const [isCardShadow, setIsCardShadow] = useState<boolean>(config.isCardShadow);
  const [isLayout, setIsLayout] = useState<string>(config.isLayout);
  const [isBorderRadius, setIsBorderRadius] = useState<number>(config.isBorderRadius);
  const [isCollapse, setIsCollapse] = useState<string>(config.isCollapse);
  const [isLanguage, setIsLanguage] = useState<string>(config.isLanguage);
  const [isSidebarHover, setIsSidebarHover] = useState<boolean>(false);
  const [isMobileSidebar, setIsMobileSidebar] = useState<boolean>(false);
  const [preferencesLoaded, setPreferencesLoaded] = useState<boolean>(false);

  // Initialize user preferences service and load user-specific preferences
  useEffect(() => {
    const loadUserPreferences = async () => {
      try {
        // Initialize the user preferences service (gets current user)
        await userPreferencesService.initialize();

        // Migrate any old global preferences
        userPreferencesService.migrateGlobalPreferences();

        // Load user-specific preferences
        const userPrefs = userPreferencesService.loadPreferences();

        // Apply loaded preferences, falling back to config defaults
        if (userPrefs.activeDir !== undefined) setActiveDir(userPrefs.activeDir);
        if (userPrefs.activeMode !== undefined) setActiveMode(userPrefs.activeMode);
        if (userPrefs.activeTheme !== undefined) setActiveTheme(userPrefs.activeTheme);
        if (userPrefs.activeLayout !== undefined) setActiveLayout(userPrefs.activeLayout);
        if (userPrefs.isCardShadow !== undefined) setIsCardShadow(userPrefs.isCardShadow);
        if (userPrefs.isLayout !== undefined) setIsLayout(userPrefs.isLayout);
        if (userPrefs.isBorderRadius !== undefined) setIsBorderRadius(userPrefs.isBorderRadius);
        if (userPrefs.isCollapse !== undefined) setIsCollapse(userPrefs.isCollapse);
        if (userPrefs.isLanguage !== undefined) setIsLanguage(userPrefs.isLanguage);

        setPreferencesLoaded(true);
        console.log('User preferences loaded successfully');
      } catch (error) {
        console.error('Failed to load user preferences:', error);
        setPreferencesLoaded(true); // Still mark as loaded to continue with defaults
      }
    };

    loadUserPreferences();
  }, []);

  // Save preferences whenever they change (but only after initial load)
  useEffect(() => {
    if (!preferencesLoaded) return;

    const currentPreferences: UserPreferences = {
      activeDir,
      activeMode,
      activeTheme,
      activeLayout,
      isCardShadow,
      isLayout,
      isBorderRadius,
      isCollapse,
      isLanguage,
    };

    userPreferencesService.savePreferences(currentPreferences);
  }, [
    activeDir,
    activeMode,
    activeTheme,
    activeLayout,
    isCardShadow,
    isLayout,
    isBorderRadius,
    isCollapse,
    isLanguage,
    preferencesLoaded,
  ]);

  // Utility function to clear user preferences
  const clearUserPreferences = () => {
    userPreferencesService.clearPreferences();
    console.log('User preferences cleared');
  };

  // Utility function to reset to defaults
  const resetToDefaults = () => {
    setActiveDir(config.activeDir);
    setActiveMode(config.activeMode);
    setActiveTheme(config.activeTheme);
    setActiveLayout(config.activeLayout);
    setIsCardShadow(config.isCardShadow);
    setIsLayout(config.isLayout);
    setIsBorderRadius(config.isBorderRadius);
    setIsCollapse(config.isCollapse);
    setIsLanguage(config.isLanguage);
    console.log('Preferences reset to defaults');
  };
  // Set attributes immediately
  useEffect(() => {
    document.documentElement.setAttribute('class', activeMode);
    document.documentElement.setAttribute('dir', activeDir);
    document.documentElement.setAttribute('data-color-theme', activeTheme);
    document.documentElement.setAttribute('data-layout', activeLayout);
    document.documentElement.setAttribute('data-boxed-layout', isLayout);
    document.documentElement.setAttribute('data-sidebar-type', isCollapse);
  }, [activeMode, activeDir, activeTheme, activeLayout, isLayout, isCollapse]);

  return (
    <CustomizerContext.Provider
      value={{
        activeDir,
        setActiveDir,
        activeMode,
        setActiveMode,
        activeTheme,
        setActiveTheme,
        activeLayout,
        setActiveLayout,
        isCardShadow,
        setIsCardShadow,
        isLayout,
        setIsLayout,
        isBorderRadius,
        setIsBorderRadius,
        isCollapse,
        setIsCollapse,
        isLanguage,
        setIsLanguage,
        isSidebarHover,
        setIsSidebarHover,
        isMobileSidebar,
        setIsMobileSidebar,
        preferencesLoaded,
        currentUser: userPreferencesService.getCurrentUser(),
        clearUserPreferences,
        resetToDefaults,
      }}
    >
      {children}
    </CustomizerContext.Provider>
  );
};
