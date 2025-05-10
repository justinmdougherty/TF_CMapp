// src/theme/LightThemeColors.tsx

// Assuming you've updated DefaultColors.tsx as above for reference to status/text/background
// Or, you can explicitly define text, background, success, info, error, warning here per theme.

const LightThemeColors = [
  {
    name: 'GOVERNMENT_BLUE_THEME', // Renamed for clarity
    palette: {
      primary: {
        main: '#0A4A8F', // Professional Navy Blue
        light: '#E6EFF8', // Lighter, slightly desaturated blue for backgrounds/hover
        dark: '#073362', // Darker shade
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#4A6A80', // Slate Blue/Grey
        light: '#D8E0E6', // Lighter version
        dark: '#354B5B', // Darker version
        contrastText: '#ffffff',
      },
      // Explicitly setting background and text for this theme, overriding DefaultColors if needed
      background: {
        default: '#EFF2F5', // Light grey app background
        paper: '#FFFFFF', // White for cards, paper elements
      },
      text: {
        primary: '#212529', // Almost black
        secondary: '#495057', // Dark grey
        disabled: '#ADB5BD', // Medium grey
      },
      // Status colors can be inherited from DefaultColors.tsx or overridden here:
      // success: { main: '#198754', light: '#E8F5E9', dark: '#146C43', contrastText: '#ffffff' },
      // error: { main: '#DC3545', light: '#FDEDED', dark: '#B02A37', contrastText: '#ffffff' },
      // warning: { main: '#FFC107', light: '#FFF9E6', dark: '#D9A406', contrastText: '#000000' },
      // info: { main: '#0D6EFD', light: '#E7F1FF', dark: '#0A58CA', contrastText: '#ffffff' },
      divider: '#DEE2E6',
    },
  },
  // You can remove the other themes (AQUA_THEME, PURPLE_THEME, etc.)
  // if you only want to use this one. For example:
  // const LightThemeColors = [
  //   { name: 'GOVERNMENT_BLUE_THEME', palette: { /* ... as above ... */ }},
  // ];
  // For now, I'll leave them so you can see the structure, but you should remove unused ones.
  {
    name: 'AQUA_THEME', // This is an example of another theme from the template
    palette: {
      // You would update this too or remove it
      primary: {
        main: '#0074BA',
        light: '#EFF9FF',
        dark: '#006DAF',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#47D7BC',
        light: '#EDFBF7',
        dark: '#39C7AD',
        contrastText: '#ffffff',
      },
    },
  },
  {
    name: 'PURPLE_THEME',
    palette: {
      primary: {
        main: '#763EBD',
        light: '#F2ECF9',
        dark: '#6E35B7',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#95CFD5',
        light: '#EDF8FA',
        dark: '#8BC8CE',
        contrastText: '#ffffff',
      },
    },
  },
  {
    name: 'GREEN_THEME',
    palette: {
      primary: {
        main: '#0A7EA4',
        light: '#F4F9FB',
        dark: '#06769A',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#CCDA4E',
        light: '#FAFBEF',
        dark: '#C3D046',
        contrastText: '#ffffff',
      },
    },
  },
  {
    name: 'CYAN_THEME',
    palette: {
      primary: {
        main: '#01C0C8',
        light: '#EBF9FA',
        dark: '#00B9C0',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#FB9678',
        light: '#FFF5F2',
        dark: '#F48B6C',
        contrastText: '#ffffff',
      },
    },
  },
  {
    name: 'ORANGE_THEME',
    palette: {
      primary: {
        main: '#FA896B',
        light: '#FBF2EF',
        dark: '#F48162',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#0074BA',
        light: '#EFF9FF',
        dark: '#006FB1',
        contrastText: '#ffffff',
      },
    },
  },
];

export { LightThemeColors };
