import { Platform } from 'react-native';

export const theme = {
  colors: {
    primary: {
      main: '#FADADD', // Blush Pink
      light: '#FCE7EF', // Pastel Pink
      dark: '#F8D8E4', // Soft Rose
    },
    secondary: {
      main: '#EEE9FF', // Light Lavender
      light: '#EEF1FF', // Soft Periwinkle
    },
    tertiary: {
      main: '#FFFDFD', // Pearl White
    },
    background: {
      default: '#FFF7F2', // Warm Cream
      paper: 'rgba(255, 255, 255, 0.25)', // Translucent White Glass for heavy blur
      surface: 'rgba(255, 255, 255, 0.4)',
    },
    text: {
      primary: '#2C2C2C', // Rich Charcoal
      secondary: '#8C8C94', // Muted Grey
      accent: '#B59B91', // Soft Brown / Rose Gold hue
    },
    border: {
      glass: 'rgba(255, 255, 255, 0.7)', // Distinct premium glass border
      light: 'rgba(0,0,0,0.03)',
    },
    shadow: {
      glass: 'rgba(165, 150, 180, 0.12)', // Soft lavender-grey shadows
      glow: 'rgba(255, 255, 255, 0.8)', // White glow
    },
    state: {
      error: '#E59B9B',
      success: '#A3D2A3',
      warning: '#F2D194',
    },
  },
  typography: {
    fontFamily: {
      brand: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif-light',
      body: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif',
    }
  },
  spacing: {
    xs: 8,
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48,
    xxl: 64,
  },
  radius: {
    sm: 16,
    md: 24,
    lg: 32,
    xl: 40, 
    full: 9999,
  },
};
