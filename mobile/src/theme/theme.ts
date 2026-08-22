import { Platform } from 'react-native';

export const theme = {
  colors: {
    primary: {
      main: '#CB6D73', // Dusty Rose / Mauve Accent
      light: '#F8EFF0', // Soft Rose Tint
      dark: '#B05359', // Deep Rose
    },
    secondary: {
      main: '#232127', // Deep Charcoal / Luxury Black
      light: '#3A3740',
    },
    tertiary: {
      main: '#FFFFFF',
    },
    background: {
      default: '#FAF8F5', // Ultra-clean Warm Porcelain
      paper: '#FFFFFF',
      surface: '#F5F2EC',
      chip: '#F4F0EB',
    },
    text: {
      primary: '#1A1918', // Deep Charcoal
      secondary: '#8E8A85', // Warm Muted Grey
      accent: '#CB6D73', // Rose Accent
      dark: '#232127',
    },
    border: {
      glass: 'rgba(255, 255, 255, 0.85)',
      light: '#ECE7E1',
      subtle: '#F0ECE6',
    },
    shadow: {
      glass: 'rgba(50, 40, 30, 0.06)',
      card: 'rgba(0, 0, 0, 0.05)',
      glow: 'rgba(203, 109, 115, 0.2)',
    },
    state: {
      error: '#E57373',
      success: '#81C784',
      warning: '#FFB74D',
    },
  },
  typography: {
    fontFamily: {
      brand: 'CormorantGaramond_700Bold',
      serif: 'CormorantGaramond_400Regular',
      serifMedium: 'CormorantGaramond_500Medium',
      serifSemiBold: 'CormorantGaramond_600SemiBold',
      serifBold: 'CormorantGaramond_700Bold',
      body: 'Inter_400Regular',
      bodyLight: 'Inter_300Light',
      bodyMedium: 'Inter_500Medium',
      bodySemiBold: 'Inter_600SemiBold',
      bodyBold: 'Inter_700Bold',
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
    sm: 12,
    md: 18,
    lg: 24,
    xl: 32, 
    full: 9999,
  },
};

