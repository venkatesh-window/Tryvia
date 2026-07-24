export const theme = {
  colors: {
    primary: {
      main: '#F2D3D8', // Pastel Blush Pink
      light: '#F8E9EB',
      dark: '#D8A7AF',
    },
    secondary: {
      main: '#E1D3F2', // Soft Lavender
      light: '#EFE7F8',
    },
    tertiary: {
      main: '#D3E1F2', // Soft Periwinkle
    },
    background: {
      default: '#FCFAF8', // Warm Cream
      paper: 'rgba(255, 255, 255, 0.45)', // Translucent White Glass (35-50% opacity constraint)
      surface: 'rgba(255, 255, 255, 0.2)',
    },
    text: {
      primary: '#2C2C2C', // Dark Charcoal text
      secondary: '#8C8C94', // Muted Grey secondary text
      disabled: '#C4C4C4',
    },
    border: {
      glass: 'rgba(255, 255, 255, 0.6)', // Thin semi-transparent white borders
      light: 'rgba(0,0,0,0.05)',
    },
    shadow: {
      glass: 'rgba(165, 150, 180, 0.15)', // Soft lavender-grey shadows
    },
    state: {
      error: '#E59B9B',
      success: '#A3D2A3',
      warning: '#F2D194',
    },
  },
  spacing: {
    xs: 8, // Generous whitespace
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48,
    xxl: 64,
  },
  radius: {
    sm: 12,
    md: 20,
    lg: 24,
    xl: 32, // Large rounded corners between 20-32px constraint
    full: 9999,
  },
};
