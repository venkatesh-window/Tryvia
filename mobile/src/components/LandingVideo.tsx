import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { VideoView } from 'expo-video';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useVideoPreload } from '../hooks/useVideoPreload';
import { LinearGradient } from 'expo-linear-gradient';

// Fallback logo if video fails
import { Text } from 'react-native';

interface LandingVideoProps {
  onFinished: () => void;
}

export function LandingVideo({ onFinished }: LandingVideoProps) {
  // Use require for local asset
  const videoSource = require('../assets/intro.mp4');
  const { player, isReady, hasError } = useVideoPreload(videoSource);
  
  const opacity = useSharedValue(0);
  const [isVideoFinished, setIsVideoFinished] = useState(false);
  const hasTriggeredFinish = useRef(false);

  // Play video when ready
  useEffect(() => {
    if (isReady && player && !isVideoFinished) {
      player.play();
      // Fade in video
      opacity.value = withTiming(1, { duration: 700 });
    }
  }, [isReady, player, opacity, isVideoFinished]);

  // Handle fallback if video fails to load
  useEffect(() => {
    if (hasError && !hasTriggeredFinish.current) {
      hasTriggeredFinish.current = true;
      opacity.value = withTiming(1, { duration: 700 });
      setTimeout(() => {
        onFinished();
      }, 1000); // show logo for 1 second then finish
    }
  }, [hasError, opacity, onFinished]);

  // Listen to the playback status
  useEffect(() => {
    if (!player) return;
    const subscription = player.addListener('playToEnd', () => {
      if (hasTriggeredFinish.current) return;
      hasTriggeredFinish.current = true;
      setIsVideoFinished(true);
      
      // Freeze for 400ms then finish to let router handle the crossfade
      setTimeout(() => {
        onFinished();
      }, 400);
    });

    return () => {
      subscription.remove();
    };
  }, [player, onFinished, opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        {hasError ? (
          <View style={styles.fallbackContainer}>
            <Text style={styles.fallbackText}>TRYVIA</Text>
          </View>
        ) : (
          <View style={StyleSheet.absoluteFill}>
            <VideoView
              style={StyleSheet.absoluteFill}
              player={player}
              allowsFullscreen={false}
              allowsPictureInPicture={false}
              showsTimecodes={false}
              nativeControls={false}
              contentFit="cover" // Expo video uses contentFit
            />
            {/* Optional subtle dark vignette / gradient at bottom */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.15)']}
              style={styles.gradient}
              pointerEvents="none"
            />
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Never show a blank white screen
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
  },
  fallbackContainer: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    color: '#fff',
    fontSize: 32,
    fontFamily: 'PlayfairDisplay_700Bold',
    letterSpacing: 4,
  },
});
