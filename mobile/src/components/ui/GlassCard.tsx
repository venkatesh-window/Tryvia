import React from 'react';
import { ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  animated?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  intensity = 30,
  animated = true,
}) => {
  const theme = useTheme();

  const content = (
    <BlurView
      intensity={intensity}
      tint="light"
      style={[
        {
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: theme.colors.border.glass,
          overflow: 'hidden',
          backgroundColor: theme.colors.background.paper,
        },
        { shadowColor: theme.colors.shadow.glass, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
        style,
      ]}
    >
      {children}
    </BlurView>
  );

  if (animated) {
    return (
      <Animated.View entering={FadeInUp.duration(500).springify()}>
        {content}
      </Animated.View>
    );
  }

  return content;
};
