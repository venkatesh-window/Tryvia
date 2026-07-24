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

export default function RegisterScreen() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: async (data) => {
      await login(data.access_token, {
        id: data.user.id,
        email: data.user.email,
        fullName: data.user.full_name || '',
        loyaltyTier: data.user.loyalty_tier,
        walletBalance: data.user.wallet_balance,
        stars: data.user.stars
      });
      router.replace('/(tabs)' as any);
    }
  });

  const registerMutation = useMutation({
    mutationFn: authService.register,
    onSuccess: async (data) => {
      // Auto-login directly using the token from the registration response
      await login(data.access_token, {
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
      console.error('Registration failed', error);
      Alert.alert('Registration Failed', 'An error occurred while creating your account.');
    },
  });
  
  const handleRegister = () => {
    registerMutation.mutate({
      email,
      password,
      full_name: fullName || undefined,
    });
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <Typography variant="h1" align="center">Join TRYVIA</Typography>
            <Typography variant="body" color="secondary" align="center" style={styles.subtitle}>
              Start discovering premium beauty today.
            </Typography>
          </View>

          <GlassCard style={styles.formCard}>
            <PremiumInput
              label="Full Name"
              value={fullName}
              onChangeText={setFullName}
            />

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
                title={registerMutation.isPending || loginMutation.isPending ? "Creating Account..." : "Create Account"} 
                onPress={handleRegister}
              />
            </View>

            <View style={styles.loginPrompt}>
              <Typography variant="caption" color="secondary" align="center">
                Already have an account?
              </Typography>
              <Pressable onPress={() => router.replace('/(auth)/login' as any)} style={styles.linkButton}>
                <Typography variant="body" color="primary" weight="bold">Log In</Typography>
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
  loginPrompt: {
    marginTop: 24,
    alignItems: 'center',
    gap: 8,
  },
  linkButton: {
    padding: 8,
  },
});
