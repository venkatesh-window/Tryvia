import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface TypographyProps extends TextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption';
  color?: 'primary' | 'secondary' | 'error' | 'inverse';
  weight?: 'regular' | 'medium' | 'bold';
  align?: 'left' | 'center' | 'right';
}

export function Typography({
  variant = 'body',
  color = 'primary',
  weight = 'regular',
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
    // Luxury Serifs for Headers
    if (variant === 'h1' || variant === 'h2' || variant === 'h3') {
       return weight === 'bold' ? 'CormorantGaramond_700Bold' : 'CormorantGaramond_400Regular';
    }
    // Clean Sans-Serif for body/caption
    if (weight === 'bold') return 'Inter_600SemiBold';
    if (weight === 'medium') return 'Inter_500Medium';
    return 'Inter_400Regular';
  };

  const getFontSize = () => {
    switch (variant) {
      case 'h1': return 32;
      case 'h2': return 24;
      case 'h3': return 18;
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
