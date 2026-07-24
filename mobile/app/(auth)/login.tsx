import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { Typography } from '../../src/components/ui/Typography';
import { PremiumInput } from '../../src/components/ui/PremiumInput';
import { PremiumButton } from '../../src/components/ui/PremiumButton';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useMutation } from '@tanstack/react-query';
import { authService } from '../../src/api/services/authService';
import { Alert } from 'react-native';

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: async (data) => {
      // Store token and user state
      login(data.access_token, {
        id: data.user.id,
        email: data.user.email,
        fullName: data.user.full_name || '',
        loyaltyTier: data.user.loyalty_tier,
        walletBalance: data.user.wallet_balance,
        stars: data.user.stars
      });
      router.replace('/(tabs)' as any);
    },
    onError: (error) => {
      console.error('Login failed', error);
      Alert.alert('Login Failed', 'Invalid email or password. Please try again.');
    },
  });
  
  const handleLogin = () => {
    loginMutation.mutate({ username: email, password });
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <Typography variant="h1" align="center">Welcome Back</Typography>
            <Typography variant="body" color="secondary" align="center" style={styles.subtitle}>
              Log in to continue your beauty discovery.
            </Typography>
          </View>

          <GlassCard style={styles.formCard}>
            <PremiumInput
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <PremiumInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            
            <View style={styles.buttonWrapper}>
              <PremiumButton 
                title={loginMutation.isPending ? "Logging in..." : "Log In"} 
                onPress={handleLogin} 
              />
            </View>

            <View style={styles.registerPrompt}>
              <Typography variant="caption" color="secondary" align="center">
                Don't have an account?
              </Typography>
              <Pressable onPress={() => router.replace('/(auth)/register' as any)} style={styles.linkButton}>
                <Typography variant="caption" color="primary" weight="bold">Create Account</Typography>
              </Pressable>
            </View>
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 48,
  },
  subtitle: {
    marginTop: 8,
  },
  formCard: {
    padding: 24,
  },
  buttonWrapper: {
    marginTop: 32,
  },
  registerPrompt: {
    marginTop: 24,
    alignItems: 'center',
    gap: 8,
  },
  linkButton: {
    padding: 8,
  },
});
