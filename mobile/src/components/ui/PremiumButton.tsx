import React from 'react';
import { StyleSheet, Pressable, ViewStyle, Platform } from 'react-native';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { Typography } from './Typography';
import { useTheme } from '../../hooks/useTheme';
import { BlurView } from 'expo-blur';

interface PremiumButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'glass';
  disabled?: boolean;
  style?: ViewStyle;
}

export const PremiumButton: React.FC<PremiumButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
}) => {
  const theme = useTheme();

  const getBackgroundColor = () => {
    if (disabled) return 'rgba(255,255,255,0.2)';
    switch (variant) {
      case 'primary': return theme.colors.text.primary;
      case 'secondary': return theme.colors.background.paper;
      case 'glass': return 'transparent';
      case 'ghost': return 'transparent';
      default: return theme.colors.text.primary;
    }
  };

  const getTextColor = (): 'inverse' | 'primary' | 'secondary' => {
    switch (variant) {
      case 'primary': return 'inverse';
      case 'secondary': return 'primary';
      case 'glass': return 'primary';
      case 'ghost': return 'primary';
      default: return 'inverse';
    }
  };

  const handlePressIn = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const innerContent = (
    <Typography
      variant="h3"
      weight="medium"
      color={getTextColor()}
      align="center"
    >
      {title}
    </Typography>
  );

  return (
    <Pressable 
      disabled={disabled}
      onPress={disabled ? undefined : onPress} 
      onPressIn={disabled ? undefined : handlePressIn}
      android_ripple={disabled ? undefined : { color: 'rgba(255,255,255,0.2)', borderless: false }}
    >
      {({ pressed }) => (
        <MotiView
          animate={{
            scale: pressed ? 0.95 : 1,
            opacity: pressed ? 0.8 : 1,
          }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 15,
          }}
          style={[
            styles.container,
            {
              backgroundColor: getBackgroundColor(),
              borderRadius: theme.radius.full, // Pill shape
              borderWidth: (variant === 'secondary' || variant === 'glass') ? 1.5 : 0,
              borderColor: theme.colors.border.glass,
            },
            variant === 'primary' ? {
              shadowColor: theme.colors.shadow.glass,
              shadowOffset: { width: 0, height: 16 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
              elevation: 12,
            } : {},
            variant === 'glass' ? {
              shadowColor: theme.colors.shadow.glow,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.8,
              shadowRadius: 15,
              elevation: 10,
              overflow: 'hidden',
            } : {},
            style,
          ]}
        >
          {variant === 'glass' ? (
            <BlurView  intensity={40} tint="light" style={styles.blurContainer}>
              {innerContent}
            </BlurView>
          ) : (
            innerContent
          )}
        </MotiView>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: 56,
    justifyContent: 'center',
  },
  blurContainer: {
    ...(StyleSheet.absoluteFill as any),
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)', // Frosted glass appearance
  },
});
