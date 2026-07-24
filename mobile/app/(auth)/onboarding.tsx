import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { Typography } from '../../src/components/ui/Typography';
import { PremiumButton } from '../../src/components/ui/PremiumButton';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const router = useRouter();

  return (
    <ScreenContainer showOrbs={true}>
      <View style={styles.container}>
        <Animated.View 
          entering={FadeIn.duration(1000)} 
          style={styles.content}
        >
          <Animated.View entering={SlideInRight.delay(300).springify()}>
            <Typography variant="h1" align="center" style={styles.title}>
              Discover. Try.
            </Typography>
            <Typography variant="h1" align="center" style={styles.title}>
              Experience.
            </Typography>
          </Animated.View>
          
          <Animated.View entering={FadeIn.delay(800)}>
            <Typography variant="body" color="secondary" align="center" style={styles.subtitle}>
              Eliminate purchase regret. Try premium beauty testers at home, and get full wallet credit when you upgrade.
            </Typography>
          </Animated.View>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(1200)} style={styles.footer}>
          <PremiumButton 
            title="Get Started" 
            onPress={() => router.push('/(auth)/login' as any)} 
          />
        </Animated.View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginTop: 24,
    maxWidth: width * 0.8,
    lineHeight: 24,
  },
  footer: {
    marginBottom: 48,
  },
});
