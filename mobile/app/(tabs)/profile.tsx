import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { Typography } from '../../src/components/ui/Typography';
import { PremiumButton } from '../../src/components/ui/PremiumButton';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/onboarding' as any);
  };

  return (
    <ScreenContainer>
      <View style={styles.container}>
        <Typography variant="h1">Profile</Typography>
        <Typography variant="body" color="secondary" style={styles.subtitle}>
          Settings & Orders
        </Typography>
        
        <PremiumButton 
          title="Log Out" 
          variant="ghost" 
          onPress={handleLogout} 
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    marginBottom: 32,
  }
});
