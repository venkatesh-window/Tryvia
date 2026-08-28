import React, { useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Typography } from '../src/components/ui/Typography';
import { useAuthStore } from '../src/store/useAuthStore';
import Animated, { 
  FadeIn, 
  FadeInUp, 
  FadeOut,
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSequence,
  withDelay,
  Easing 
} from 'react-native-reanimated';
import { MotiView } from 'moti';
import { Sparkles, Crown } from 'lucide-react-native';

export default function Index() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const logoScale = useSharedValue(0.8);
  const auraOpacity = useSharedValue(0);

  useEffect(() => {
    // Ethereal scale & aura sequence
    logoScale.value = withSequence(
      withTiming(1.04, { duration: 900, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 600, easing: Easing.inOut(Easing.quad) })
    );

    auraOpacity.value = withTiming(0.8, { duration: 1000 });

    // Seamless cinematic dissolve into Home
    const timer = setTimeout(() => {
      if (isAuthenticated) {
        if (user?.role === 'VENDOR') {
          router.replace('/vendor' as any);
        } else {
          router.replace('/(tabs)');
        }
      } else {
        router.replace('/(tabs)');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  const auraAnimatedStyle = useAnimatedStyle(() => ({
    opacity: auraOpacity.value,
  }));

  return (
    <Animated.View exiting={FadeOut.duration(400)} style={styles.container}>
      {/* Background Soft Breathing Ambient Rings */}
      <MotiView
        from={{ scale: 0.85, opacity: 0.15 }}
        animate={{ scale: 1.35, opacity: 0.35 }}
        transition={{
          type: 'timing',
          duration: 1800,
          loop: true,
        }}
        style={styles.outerAura}
      />

      <MotiView
        from={{ scale: 1, opacity: 0.25 }}
        animate={{ scale: 0.8, opacity: 0.5 }}
        transition={{
          type: 'timing',
          duration: 1400,
          loop: true,
        }}
        style={styles.innerAura}
      />

      {/* Floating Sparkle Micro-Accents */}
      <MotiView
        from={{ translateY: 0, opacity: 0.4 }}
        animate={{ translateY: -12, opacity: 0.9 }}
        transition={{
          type: 'timing',
          duration: 1200,
          loop: true,
        }}
        style={styles.sparkleTopLeft}
      >
        <Sparkles size={18} color="#CB6D73" strokeWidth={1.5} />
      </MotiView>

      <MotiView
        from={{ translateY: 0, opacity: 0.3 }}
        animate={{ translateY: 10, opacity: 0.85 }}
        transition={{
          type: 'timing',
          duration: 1500,
          loop: true,
        }}
        style={styles.sparkleBottomRight}
      >
        <Sparkles size={15} color="#D47A83" strokeWidth={1.5} />
      </MotiView>

      {/* Main Center Content */}
      <View style={styles.centerContent}>
        {/* Animated Brand Emblem */}
        <Animated.View style={[styles.emblemContainer, logoAnimatedStyle]}>
          <MotiView
            from={{ scale: 0.96 }}
            animate={{ scale: 1.06 }}
            transition={{
              type: 'timing',
              duration: 1100,
              loop: true,
            }}
            style={styles.emblemHalo}
          />
          <Image
            source={require('../assets/images/main-logo.png')}
            style={styles.logoImage}
            contentFit="contain"
          />
        </Animated.View>

        {/* Brand Name */}
        <Animated.View entering={FadeInUp.duration(700).delay(250)} style={styles.brandTitleRow}>
          <Typography style={styles.brandTitle}>TryVia</Typography>
        </Animated.View>

        {/* Luxury Tagline Pill Badge */}
        <Animated.View entering={FadeInUp.duration(700).delay(400)} style={styles.taglinePill}>
          <Typography style={styles.taglineText}>DISCOVER • TRY • LOVE</Typography>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  outerAura: {
    position: 'absolute',
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: '#F7E7E9',
  },
  innerAura: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#FCEEF0',
  },
  sparkleTopLeft: {
    position: 'absolute',
    top: '36%',
    left: '26%',
    zIndex: 3,
  },
  sparkleBottomRight: {
    position: 'absolute',
    bottom: '38%',
    right: '25%',
    zIndex: 3,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  emblemContainer: {
    width: 106,
    height: 106,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
    position: 'relative',
  },
  emblemHalo: {
    position: 'absolute',
    width: 106,
    height: 106,
    borderRadius: 53,
    backgroundColor: '#F9DBDF',
    borderWidth: 1.5,
    borderColor: '#F2CDD1',
  },
  logoImage: {
    width: 78,
    height: 78,
    borderRadius: 20,
  },
  brandTitleRow: {
    marginBottom: 12,
  },
  brandTitle: {
    fontFamily: 'CormorantGaramond_700Bold',
    fontSize: 46,
    color: '#1A1918',
    letterSpacing: 1.2,
  },
  taglinePill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ECE7E1',
    shadowColor: '#CB6D73',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  taglineText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10.5,
    color: '#CB6D73',
    letterSpacing: 3.5,
  },
});
