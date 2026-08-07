import { useEffect } from 'react';
import { Stack, useRootNavigationState, ErrorBoundary } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '../src/store/useAuthStore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { View, StyleSheet, LogBox } from 'react-native';
import { 
  useFonts, 
  CormorantGaramond_300Light,
  CormorantGaramond_400Regular, 
  CormorantGaramond_500Medium,
  CormorantGaramond_600SemiBold,
  CormorantGaramond_700Bold,
  CormorantGaramond_400Regular_Italic,
  CormorantGaramond_700Bold_Italic
} from '@expo-google-fonts/cormorant-garamond';
import { 
  Inter_300Light,
  Inter_400Regular, 
  Inter_500Medium, 
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold
} from '@expo-google-fonts/inter';

SplashScreen.preventAutoHideAsync().catch(() => {});
LogBox.ignoreLogs(['SafeAreaView has been deprecated']);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
    },
  },
});

function RootLayoutNav() {
  const { isLoading, restoreToken } = useAuthStore();

  let [fontsLoaded] = useFonts({
    CormorantGaramond_300Light,
    CormorantGaramond_400Regular,
    CormorantGaramond_500Medium,
    CormorantGaramond_600SemiBold,
    CormorantGaramond_700Bold,
    CormorantGaramond_400Regular_Italic,
    CormorantGaramond_700Bold_Italic,
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  useEffect(() => {
    restoreToken();
  }, []);

  // Instantly dismiss splash screen as soon as fonts are loaded so video/landing starts immediately
  useEffect(() => {
    if (fontsLoaded && !isLoading) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, isLoading]);

  if (!fontsLoaded || isLoading) {
    return <View style={styles.loadingContainer} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ animation: 'fade' }} />
        <Stack.Screen name="landing" options={{ animation: 'fade' }} />
        <Stack.Screen 
          name="(tabs)" 
          options={{ 
            animation: 'fade', 
            animationDuration: 500 
          }} 
        />
        <Stack.Screen name="product/[id]" />
        <Stack.Screen name="tester/[id]" />
        <Stack.Screen name="cart" options={{ presentation: 'modal' }} />
      </Stack>
    </QueryClientProvider>
  );
}

export { ErrorBoundary };
export default RootLayoutNav;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
