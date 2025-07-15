// src/theme/DefaultColors.tsx
import { grey } from '@mui/material/colors'; // 'grey' will now be used

const baselightTheme = {
  direction: 'ltr',
  palette: {
    primary: {
      main: '#0A4A8F',
      light: '#E6EFF8',
      dark: '#073362',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#4A6A80',
      light: '#D8E0E6',
      dark: '#354B5B',
      contrastText: '#ffffff',
    },
    success: { main: '#198754', light: '#E8F5E9', dark: '#146C43', contrastText: '#ffffff' },
    info: { main: '#0D6EFD', light: '#E7F1FF', dark: '#0A58CA', contrastText: '#ffffff' },
    error: { main: '#DC3545', light: '#FDEDED', dark: '#B02A37', contrastText: '#ffffff' },
    warning: { main: '#FFC107', light: '#FFF9E6', dark: '#D9A406', contrastText: '#000000' },

    // Using the imported 'grey' object from MUI for the grey scale
    grey: {
      50: grey[50], // #fafafa (Very light, new paper background)
      100: grey[100], // #f5f5f5
      200: grey[200], // #eeeeee (New default background)
      300: grey[300], // #e0e0e0
      400: grey[400], // #bdbdbd (New divider)
      500: grey[500], // #9e9e9e (Disabled text)
      600: grey[600], // #757575
      700: grey[700], // #616161 (Secondary text)
      800: grey[800], // #424242
      900: grey[900], // #212121 (Primary text)
    },
    text: {
      primary: grey[900], // Dark grey for strong contrast on the new paper color
      secondary: grey[700],
      disabled: grey[500],
    },
    action: {
      active: 'rgba(0, 0, 0, 0.54)',
      hover: 'rgba(0, 0, 0, 0.04)',
      hoverOpacity: 0.04,
      selected: 'rgba(0, 0, 0, 0.08)',
      disabled: 'rgba(0, 0, 0, 0.26)',
      disabledBackground: 'rgba(0, 0, 0, 0.12)',
      focus: 'rgba(0, 0, 0, 0.12)',
      focusOpacity: 0.12,
    },
    divider: grey[400], // Using a shade from the MUI grey scale
    background: {
      default: grey[200], // Light Grey background (e.g., #eeeeee)
      paper: grey[50], // Off-white / Very Light Grey for cards (e.g., #fafafa)
    },
  },
};

// Dark theme remains the same as your preferred version (from default_colors_v4_fixed_grey or earlier)
const baseDarkTheme = {
  direction: 'ltr',
  palette: {
    primary: {
      main: '#5D87FF',
      light: '#3E5F8A',
      dark: '#0A4A8F',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#6C7E8E',
      light: '#4A5A68',
      dark: '#354B5B',
      contrastText: '#E0E0E0',
    },
    success: { main: '#2E7D32', light: '#1B3D1F', dark: '#1E5E24', contrastText: '#E8F5E9' },
    info: { main: '#0288D1', light: '#1A3A4A', dark: '#01579B', contrastText: '#E1F5FE' },
    error: { main: '#D32F2F', light: '#442529', dark: '#C62828', contrastText: '#FFEBEE' },
    warning: { main: '#FFA000', light: '#4D3A2A', dark: '#F57C00', contrastText: '#000000' },
    grey: {
      50: grey[900],
      100: grey[800],
      200: '#22272B',
      300: '#2C3136',
      400: grey[700],
      500: grey[600],
      600: grey[500],
      700: grey[400],
      800: grey[300],
      900: grey[200],
    },
    text: {
      primary: '#E4E7EB',
      secondary: grey[400],
      disabled: grey[600],
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
    divider: grey[500],
    background: {
      default: '#22272B',
      paper: '#2C3136',
    },
  },
};

export { baseDarkTheme, baselightTheme };
