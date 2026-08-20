import React, { useEffect, memo } from 'react';
import { View, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { theme } from '../../theme/theme';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence, 
  withDelay, 
  Easing 
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';

interface ScreenContainerProps {
  children: React.ReactNode;
  showOrbs?: boolean;
}

// Ultra-premium animated bubble component
const Bubble = memo(({ delay, startX, size, duration, windowHeight }: any) => {
  const translateY = useSharedValue(windowHeight || 800);
  const translateX = useSharedValue(startX);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(delay, withRepeat(
      withTiming(-size, { duration, easing: Easing.linear }), 
      -1, 
      false
    ));
    
    translateX.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(startX + 30, { duration: duration / 2, easing: Easing.inOut(Easing.ease) }),
        withTiming(startX - 30, { duration: duration / 2, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    ));

    opacity.value = withDelay(delay, withSequence(
      withTiming(0.5, { duration: 2000 }),
      withTiming(0.5, { duration: duration - 4000 }),
      withTiming(0, { duration: 2000 })
    ));
  }, [windowHeight]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value }
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.bubble, { width: size, height: size, borderRadius: size / 2 }, animatedStyle]}>
      <LinearGradient
        colors={['rgba(255,255,255,0.6)', 'rgba(255,255,255,0.05)']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.bubbleHighlight} />
    </Animated.View>
  );
});

export function ScreenContainer({ children, showOrbs = true }: ScreenContainerProps) {
  const { width, height } = useWindowDimensions();
  const gradientOpacity = useSharedValue(0.4);

  useEffect(() => {
    if (showOrbs) {
      gradientOpacity.value = withRepeat(
        withTiming(0.8, { duration: 6000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }
  }, [showOrbs]);

  const bgAnimatedStyle = useAnimatedStyle(() => ({
    opacity: gradientOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.backgroundBase} />
      
      {showOrbs && (
        <>
          <Animated.View style={[StyleSheet.absoluteFill, bgAnimatedStyle]}>
            <Image 
              source={require('../../assets/bg.png')} 
              style={StyleSheet.absoluteFill} 
              contentFit="cover"
            />
          </Animated.View>

          {/* Drifting Glass Bubbles */}
          <Bubble delay={0} startX={width * 0.2} size={45} duration={14000} windowHeight={height} />
          <Bubble delay={3000} startX={width * 0.7} size={65} duration={18000} windowHeight={height} />
          <Bubble delay={6000} startX={width * 0.4} size={35} duration={12000} windowHeight={height} />
          <Bubble delay={8000} startX={width * 0.8} size={25} duration={16000} windowHeight={height} />
          <Bubble delay={1000} startX={width * 0.1} size={55} duration={20000} windowHeight={height} />
        </>
      )}
      
      <View style={styles.contentLayer}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  backgroundBase: {
    ...(StyleSheet.absoluteFill as any),
    backgroundColor: theme.colors.background.default,
  },
  contentLayer: {
    flex: 1,
    zIndex: 10,
  },
  bubble: {
    position: 'absolute',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.6)',
    overflow: 'hidden',
    shadowColor: theme.colors.shadow.glow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  bubbleHighlight: {
    position: 'absolute',
    top: '12%',
    left: '18%',
    width: '35%',
    height: '25%',
    backgroundColor: '#ffffff',
    borderRadius: 100,
    opacity: 0.5,
    transform: [{ rotate: '-45deg' }]
  }
});

