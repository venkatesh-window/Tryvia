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

import * as SplashScreen from 'expo-splash-screen';

interface LandingVideoProps {
  onFinished: () => void;
}

export function LandingVideo({ onFinished }: LandingVideoProps) {
  // Use require for local asset
  const videoSource = require('../assets/intro.mp4');
  const { player, isReady, hasError } = useVideoPreload(videoSource);
  const [isVideoFinished, setIsVideoFinished] = useState(false);
  const hasTriggeredFinish = useRef(false);
  const hasStarted = useRef(false);

  // Play video immediately from start when ready
  useEffect(() => {
    if (isReady && player && !hasStarted.current && !isVideoFinished) {
      hasStarted.current = true;
      player.currentTime = 0;
      player.play();
      // Instantly dismiss splash screen so video is visible from frame 0
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isReady, player, isVideoFinished]);

  // Safety fallback if video fails or takes too long to load (e.g. 2.5s)
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      if (!hasStarted.current && !hasTriggeredFinish.current) {
        SplashScreen.hideAsync().catch(() => {});
        if (player && player.status === 'readyToPlay') {
          player.currentTime = 0;
          player.play();
        } else {
          onFinished();
        }
      }
    }, 2500);

    return () => clearTimeout(safetyTimer);
  }, [player, onFinished]);

  // Handle fallback if video fails to load
  useEffect(() => {
    if (hasError && !hasTriggeredFinish.current) {
      hasTriggeredFinish.current = true;
      SplashScreen.hideAsync().catch(() => {});
      setTimeout(() => {
        onFinished();
      }, 1000);
    }
  }, [hasError, onFinished]);

  // Listen to the playback status
  useEffect(() => {
    if (!player) return;
    const subscription = player.addListener('playToEnd', () => {
      if (hasTriggeredFinish.current) return;
      hasTriggeredFinish.current = true;
      setIsVideoFinished(true);
      
      // Finish and transition smoothly to tabs
      setTimeout(() => {
        onFinished();
      }, 300);
    });

    return () => {
      subscription.remove();
    };
  }, [player, onFinished]);

  return (
    <View style={styles.container}>
      <StatusBar hidden />
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
            contentFit="cover"
          />
          {/* Optional subtle dark vignette / gradient at bottom */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.15)']}
            style={styles.gradient}
            pointerEvents="none"
          />
        </View>
      )}
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
    fontFamily: 'CormorantGaramond_700Bold',
    letterSpacing: 4,
  },
});
