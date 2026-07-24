import React from 'react';
import { StyleSheet, Pressable, ViewStyle } from 'react-native';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { Typography } from './Typography';
import { useTheme } from '../../hooks/useTheme';

interface PremiumButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  style?: ViewStyle;
}

export const PremiumButton: React.FC<PremiumButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  style,
}) => {
  const theme = useTheme();

  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary': return theme.colors.text.primary;
      case 'secondary': return theme.colors.background.paper;
      case 'ghost': return 'transparent';
      default: return theme.colors.text.primary;
    }
  };

  const getTextColor = (): 'inverse' | 'primary' | 'secondary' => {
    switch (variant) {
      case 'primary': return 'inverse';
      case 'secondary': return 'primary';
      case 'ghost': return 'primary';
      default: return 'inverse';
    }
  };

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn}>
      {({ pressed }) => (
        <MotiView
          animate={{
            scale: pressed ? 0.96 : 1,
            opacity: pressed ? 0.9 : 1,
          }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 25,
          }}
          style={[
            styles.container,
            {
              backgroundColor: getBackgroundColor(),
              borderRadius: theme.radius.xl,
              borderWidth: variant === 'secondary' ? 1 : 0,
              borderColor: theme.colors.border.glass,
            },
            variant === 'primary' ? {
              shadowColor: theme.colors.shadow.glass,
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.15,
              shadowRadius: 20,
              elevation: 10,
            } : {},
            style,
          ]}
        >
          <Typography
            variant="h3"
            weight="medium"
            color={getTextColor()}
            align="center"
          >
            {title}
          </Typography>
        </MotiView>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
