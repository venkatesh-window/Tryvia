export const Theme = {
  colors: {
    primary: {
      pastelPink: '#FFD1DC',
      lavender: '#E6E6FA',
      cream: '#FFFDD0',
      softWhite: '#F8F8FF',
      periwinkle: '#CCCCFF',
      lightRose: '#FFB6C1',
    },
    secondary: {
      warmGrey: '#808080',
    },
    text: {
      darkCharcoal: '#333333',
      light: '#FFFFFF',
    },
    background: {
      default: '#FDFDFD',
      glass: 'rgba(255, 255, 255, 0.65)',
    },
    border: {
      thinWhite: 'rgba(255, 255, 255, 0.4)',
    },
  },
  typography: {
    fontFamily: {
      regular: 'Inter-Regular', // Placeholder for actual font loading
      medium: 'Inter-Medium',
      bold: 'Inter-Bold',
    },
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 20,
      xl: 24,
      xxl: 32,
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    round: 9999,
  },
  shadows: {
    soft: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 10,
      },
      shadowOpacity: 0.05,
      shadowRadius: 20,
      elevation: 5,
    },
    glass: {
      shadowColor: '#fff',
      shadowOffset: {
        width: 0,
        height: 0,
      },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 2,
    },
  },
};

export type AppTheme = typeof Theme;
