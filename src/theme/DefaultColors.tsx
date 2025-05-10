import { grey } from '@mui/material/colors';

const baselightTheme = {
  direction: 'ltr',
  palette: {
    primary: {
      main: '#0A4A8F', // Default primary, will be overridden by active theme
      light: '#E6EFF8',
      dark: '#073362',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#4A6A80', // Default secondary, will be overridden by active theme
      light: '#D8E0E6',
      dark: '#354B5B',
      contrastText: '#ffffff',
    },
    success: {
      main: '#198754', // Standard success green
      light: '#E8F5E9', // Desaturated light green
      dark: '#146C43',
      contrastText: '#ffffff',
    },
    info: {
      main: '#0D6EFD', // Standard info blue
      light: '#E7F1FF', // Desaturated light blue
      dark: '#0A58CA',
      contrastText: '#ffffff',
    },
    error: {
      main: '#DC3545', // Standard error red
      light: '#FDEDED', // Desaturated light red
      dark: '#B02A37',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#FFC107', // Standard warning yellow
      light: '#FFF9E6', // Desaturated light yellow
      dark: '#D9A406',
      contrastText: '#000000', // Black text for better contrast on yellow
    },
    grey: {
      100: '#F8F9FA', // Very light grey
      200: '#EFF2F5', // Light grey
      300: '#DEE2E6', // Slightly darker light grey
      400: '#CED4DA', // Medium-light grey (good for borders)
      500: '#ADB5BD', // Medium grey (good for secondary text/icons)
      600: '#6C757D', // Darker medium grey
      700: '#495057', // Dark grey
      800: '#343A40', // Very dark grey
      900: '#212529', // Almost black
    },
    text: {
      primary: '#212529', // Almost black
      secondary: '#495057', // Dark grey
      disabled: '#ADB5BD', // Medium grey
    },
    action: {
      active: 'rgba(0, 0, 0, 0.54)',
      hover: 'rgba(0, 0, 0, 0.04)', // Light hover for light backgrounds
      hoverOpacity: 0.04,
      selected: 'rgba(0, 0, 0, 0.08)',
      disabled: 'rgba(0, 0, 0, 0.26)',
      disabledBackground: 'rgba(0, 0, 0, 0.12)',
      focus: 'rgba(0, 0, 0, 0.12)',
      focusOpacity: 0.12,
    },
    divider: '#DEE2E6', // Using grey[300]
    background: {
      default: '#EFF2F5', // Light grey main background
      paper: '#FFFFFF', // White for cards, dialogs, etc.
    },
  },
};

const baseDarkTheme = {
  direction: 'ltr',
  palette: {
    primary: {
      // Will be overridden by DarkThemeColors.tsx for active theme
      main: '#0A4A8F', // Keep consistent with light theme's primary for example
      light: '#2E67A0', // Adjusted light for dark mode
      dark: '#073362',
      contrastText: '#ffffff',
    },
    secondary: {
      // Will be overridden by DarkThemeColors.tsx for active theme
      main: '#5F8099', // Adjusted secondary for dark mode
      light: '#7F9CB3',
      dark: '#4A6A80',
      contrastText: '#ffffff',
    },
    success: {
      main: '#28A745', // Slightly brighter green for dark mode
      light: '#1C3D23', // Darker, desaturated light green background
      dark: '#1E7E34',
      contrastText: '#ffffff',
    },
    info: {
      main: '#17A2B8', // Slightly brighter info for dark mode
      light: '#1A3A40', // Darker, desaturated light info background
      dark: '#117A8B',
      contrastText: '#ffffff',
    },
    error: {
      main: '#E04B59', // Slightly brighter error for dark mode
      light: '#442529', // Darker, desaturated light error background
      dark: '#C82333',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#FFC107', // Yellow can work on dark, ensure contrastText
      light: '#4D3A2A', // Darker, desaturated light warning background
      dark: '#D9A406',
      contrastText: '#000000',
    },
    grey: {
      // Inverted greys for dark mode
      100: '#212529', // Darkest
      200: '#343A40',
      300: '#495057',
      400: '#6C757D',
      500: '#ADB5BD',
      600: '#CED4DA',
      700: '#DEE2E6',
      800: '#EFF2F5',
      900: '#F8F9FA', // Lightest
    },
    text: {
      primary: '#F8F9FA', // Light text
      secondary: '#CED4DA', // Medium-light text
      disabled: '#6C757D', // Medium-dark text for disabled
    },
    action: {
      active: 'rgba(255, 255, 255, 0.7)',
      hover: 'rgba(255, 255, 255, 0.08)',
      hoverOpacity: 0.08,
      selected: 'rgba(255, 255, 255, 0.16)',
      disabled: 'rgba(255, 255, 255, 0.3)',
      disabledBackground: 'rgba(255, 255, 255, 0.12)',
      focus: 'rgba(255, 255, 255, 0.12)',
      focusOpacity: 0.12,
    },
    divider: '#495057', // Darker divider
    background: {
      default: '#121212', // Common dark mode background
      paper: '#1E1E1E', // Slightly lighter for paper elements in dark mode
    },
  },
};

export { baseDarkTheme, baselightTheme };
