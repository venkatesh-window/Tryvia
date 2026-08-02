import React from 'react';
import { ViewStyle, StyleProp, View } from 'react-native';
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
  intensity = 40, // Increased blur for ultra-premium feel
  animated = true,
}) => {
  const theme = useTheme();

  const content = (
    <View style={[{
      shadowColor: theme.colors.shadow.glass, 
      shadowOffset: { width: 0, height: 16 }, 
      shadowOpacity: 0.25, 
      shadowRadius: 32, 
      elevation: 15,
      borderRadius: theme.radius.xl, // Pushing to 32-36px radius
    }, style]}>
      <BlurView 
        intensity={intensity}
        tint="light"
        style={[
          {
            borderRadius: theme.radius.xl,
            borderWidth: 1.5,
            borderColor: theme.colors.border.glass,
            overflow: 'hidden',
            backgroundColor: theme.colors.background.paper, // Translucent white
          },
        ]}
      >
        <View style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, height: '40%',
          backgroundColor: 'rgba(255,255,255,0.1)',
        }} />
        {children}
      </BlurView>
    </View>
  );

  if (animated) {
    return (
      <Animated.View entering={FadeInUp.duration(800).springify().damping(15)}>
        {content}
      </Animated.View>
    );
  }

  return content;
};
