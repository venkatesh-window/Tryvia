import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { VideoView } from 'expo-video';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useVideoPreload } from '../hooks/useVideoPreload';
import { LinearGradient } from 'expo-linear-gradient';

interface LandingVideoProps {
  onFinished: () => void;
}

export function LandingVideo({ onFinished }: LandingVideoProps) {
  const videoSource = require('../assets/intro.mp4');
  const { player, isReady, hasError } = useVideoPreload(videoSource);
  const [isVideoFinished, setIsVideoFinished] = useState(false);
  const hasTriggeredFinish = useRef(false);

  // Play video immediately from start (frame 0) when ready
  useEffect(() => {
    if (isReady && player && !hasTriggeredFinish.current) {
      try {
        player.currentTime = 0;
        player.play();
      } catch (e) {
        console.log('Error playing video:', e);
      }
    }
  }, [isReady, player]);

  // Safety fallback if video takes too long or fails
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      if (!hasTriggeredFinish.current) {
        hasTriggeredFinish.current = true;
        onFinished();
      }
    }, 4000);

    return () => clearTimeout(safetyTimer);
  }, [onFinished]);

  // Handle fallback if video fails to load
  useEffect(() => {
    if (hasError && !hasTriggeredFinish.current) {
      hasTriggeredFinish.current = true;
      setTimeout(() => {
        onFinished();
      }, 1500);
    }
  }, [hasError, onFinished]);

  // Listen to the playback status
  useEffect(() => {
    if (!player) return;
    try {
      const subscription = player.addListener?.('playToEnd', () => {
        if (hasTriggeredFinish.current) return;
        hasTriggeredFinish.current = true;
        setIsVideoFinished(true);
        setTimeout(() => {
          onFinished();
        }, 200);
      });

      return () => {
        try {
          subscription?.remove?.();
        } catch (e) {}
      };
    } catch (e) {
      console.log('Error listening to playToEnd:', e);
    }
  }, [player, onFinished]);

  const handleSkip = () => {
    if (!hasTriggeredFinish.current) {
      hasTriggeredFinish.current = true;
      try {
        player?.pause?.();
      } catch (e) {}
      onFinished();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      {hasError || !player ? (
        <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(400)} style={styles.fallbackContainer}>
          <Text style={styles.fallbackText}>TRYVIA</Text>
          <Text style={styles.fallbackSubtext}>HAUTE PARFUMERIE & BEAUTÉ</Text>
        </Animated.View>
      ) : (
        <TouchableOpacity activeOpacity={1} onPress={handleSkip} style={StyleSheet.absoluteFill}>
          <VideoView
            style={StyleSheet.absoluteFill}
            player={player}
            allowsFullscreen={false}
            allowsPictureInPicture={false}
            showsTimecodes={false}
            nativeControls={false}
            contentFit="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)']}
            style={styles.gradient}
            pointerEvents="none"
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
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
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    color: '#FFFFFF',
    fontSize: 38,
    fontFamily: 'CormorantGaramond_700Bold',
    letterSpacing: 6,
    marginBottom: 8,
  },
  fallbackSubtext: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 3,
  },
});
