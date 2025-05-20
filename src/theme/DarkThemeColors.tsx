// src/theme/DarkThemeColors.tsx

const DarkThemeColors = [
  {
    name: 'GOVERNMENT_BLUE_THEME', // Match the light theme name for consistency
    palette: {
      primary: {
        main: '#5D87FF', // A slightly brighter blue for good visibility on dark backgrounds
        light: '#3E5F8A', // A less intense light blue for dark mode
        dark: '#0A4A8F', // Consistent dark shade from the light theme's primary
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#6C7E8E', // A muted, professional greyish-blue for secondary elements
        light: '#4A5A68', // For hover/background states
        dark: '#354B5B',
        contrastText: '#E0E0E0', // Light contrast text
      },
      background: {
        default: '#22272B', // Dark charcoal, not pitch black
        paper: '#2C3136', // Slightly lighter charcoal for cards and elevated surfaces
      },
      text: {
        primary: '#E4E7EB', // Off-white for primary text, good readability
        secondary: '#98A2B3', // Lighter grey for secondary text
        disabled: '#667085',
      },
      divider: '#475467', // A visible but not too stark divider
      // Status colors (success, error, warning, info) will be inherited from baseDarkTheme
      // unless you specifically override them here for this dark theme variant.
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
