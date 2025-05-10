// src/theme/DarkThemeColors.tsx

const DarkThemeColors = [
  {
    name: 'GOVERNMENT_BLUE_THEME', // Match the light theme name
    palette: {
      primary: {
        main: '#5D87FF', // A slightly brighter blue for accessibility on dark backgrounds
        light: '#2E67A0', // Less vibrant light blue for dark mode
        dark: '#073362', // Darker shade
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#6C757D', // A medium grey for secondary actions
        light: '#495057', // Darker background/hover for secondary
        dark: '#ADB5BD', // Lighter for text if needed, or a darker shade of main
        contrastText: '#ffffff',
      },
      background: {
        default: '#1A1D21', // Dark grey, slightly off-black
        paper: '#23272B', // Slightly lighter for cards/paper
        dark: '#1A1D21', // Ensuring 'dark' is consistent if used by components
      },
      text: {
        primary: '#E9ECEF', // Off-white
        secondary: '#ADB5BD', // Light grey
        disabled: '#6C757D', // Medium grey
      },
      // Status colors can be inherited from DefaultColors.tsx (baseDarkTheme)
      // or overridden here for specific dark theme adjustments.
      // Example: ensure good contrast
      // success: { main: '#28a745', light: '#1c3d23', dark: '#1e7e34', contrastText: '#ffffff' },
      // error: { main: '#e04b59', light: '#442529', dark: '#c82333', contrastText: '#ffffff' },
      // warning: { main: '#ffca2c', light: '#4d3a2a', dark: '#d9a406', contrastText: '#000000' },
      // info: { main: '#17a2b8', light: '#1a3a40', dark: '#117a8b', contrastText: '#ffffff' },
      divider: '#495057', // Darker grey divider
    },
  },
  // Remove other dark themes (AQUA_THEME, PURPLE_THEME, etc.) if you only want this one.
  // I'll leave them as comments for structure, but you should remove unused ones.
  /*
  {
    name: 'AQUA_THEME',
    palette: { // Original, would need desaturation for government style
      primary: {
        main: '#0074BA', light: '#103247', dark: '#006DAF', contrastText: '#ffffff',
      },
      secondary: {
        main: '#47D7BC', light: '#0C4339', dark: '#39C7AD', contrastText: '#ffffff',
      },
    },
  },
  // ... other original dark themes ...
  */
];

export { DarkThemeColors };
