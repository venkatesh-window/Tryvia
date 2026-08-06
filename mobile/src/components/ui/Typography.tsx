import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface TypographyProps extends TextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'serif' | 'body' | 'caption';
  color?: 'primary' | 'secondary' | 'error' | 'inverse';
  weight?: 'light' | 'regular' | 'medium' | 'semibold' | 'bold' | 'extrabold';
  italic?: boolean;
  align?: 'left' | 'center' | 'right';
}

export function Typography({
  variant = 'body',
  color = 'primary',
  weight = 'regular',
  italic = false,
  align = 'left',
  style,
  children,
  ...props
}: TypographyProps) {
  const theme = useTheme();

  const getTextColor = () => {
    switch (color) {
      case 'primary': return theme.colors.text.primary;
      case 'secondary': return theme.colors.text.secondary;
      case 'error': return theme.colors.state.error;
      case 'inverse': return '#FFFFFF';
      default: return theme.colors.text.primary;
    }
  };

  const getFontFamily = () => {
    // Luxury Serifs for Headers & Serif variant -> Cormorant Garamond
    if (variant === 'h1' || variant === 'h2' || variant === 'h3' || variant === 'serif') {
      if (italic) {
        return (weight === 'bold' || weight === 'semibold' || weight === 'extrabold')
          ? 'CormorantGaramond_700Bold_Italic'
          : 'CormorantGaramond_400Regular_Italic';
      }
      switch (weight) {
        case 'light': return 'CormorantGaramond_300Light';
        case 'medium': return 'CormorantGaramond_500Medium';
        case 'semibold': return 'CormorantGaramond_600SemiBold';
        case 'bold':
        case 'extrabold': return 'CormorantGaramond_700Bold';
        case 'regular':
        default: return 'CormorantGaramond_400Regular';
      }
    }

    // Clean Sans-Serif for Body, Captions, Numbers, and standard text -> Inter
    switch (weight) {
      case 'light': return 'Inter_300Light';
      case 'medium': return 'Inter_500Medium';
      case 'semibold': return 'Inter_600SemiBold';
      case 'bold': return 'Inter_700Bold';
      case 'extrabold': return 'Inter_800ExtraBold';
      case 'regular':
      default: return 'Inter_400Regular';
    }
  };

  const getFontSize = () => {
    switch (variant) {
      case 'h1': return 32;
      case 'h2': return 24;
      case 'h3': return 18;
      case 'serif': return 16;
      case 'caption': return 12;
      case 'body':
      default: return 14;
    }
  };

  return (
    <Text
      style={[
        {
          color: getTextColor(),
          fontFamily: getFontFamily(),
          fontSize: getFontSize(),
          textAlign: align,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}
