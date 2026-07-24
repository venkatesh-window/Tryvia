import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { theme } from '../../theme/theme';

const { width, height } = Dimensions.get('window');

interface ScreenContainerProps {
  children: React.ReactNode;
  showOrbs?: boolean;
}

export function ScreenContainer({ children, showOrbs = true }: ScreenContainerProps) {
  return (
    <View style={styles.container}>
      {showOrbs && (
        <View style={styles.backgroundLayer}>
          <View style={[styles.orb, styles.orb1]} />
          <View style={[styles.orb, styles.orb2]} />
          <View style={[styles.orb, styles.orb3]} />
        </View>
      )}
      
      {/* Soft gradient overlay to blend orbs into the warm cream background */}
      <View style={styles.frostOverlay} />
      
      <View style={styles.contentLayer}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.default, // Warm cream base
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFill as any,
    overflow: 'hidden',
  },
  frostOverlay: {
    ...StyleSheet.absoluteFill as any,
    backgroundColor: 'rgba(252, 250, 248, 0.4)', // Warm cream semi-transparent overlay to soften orbs
  },
  orb: {
    position: 'absolute',
    borderRadius: 9999,
    opacity: 0.6,
  },
  orb1: {
    width: width * 1.5,
    height: width * 1.5,
    backgroundColor: theme.colors.primary.main, // Blush pink
    top: -width * 0.5,
    left: -width * 0.5,
    filter: 'blur(80px)', // Web/New RN blur, fallback to just soft colors
  },
  orb2: {
    width: width,
    height: width,
    backgroundColor: theme.colors.secondary.main, // Soft Lavender
    bottom: -height * 0.1,
    right: -width * 0.3,
    filter: 'blur(60px)',
  },
  orb3: {
    width: width * 0.8,
    height: width * 0.8,
    backgroundColor: theme.colors.tertiary.main, // Soft Periwinkle
    top: height * 0.3,
    right: -width * 0.2,
    filter: 'blur(40px)',
  },
  contentLayer: {
    flex: 1,
    zIndex: 1,
  },
});
