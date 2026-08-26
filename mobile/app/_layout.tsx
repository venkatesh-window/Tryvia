import { useEffect, useState, useRef } from 'react';
import { Stack, ErrorBoundary } from 'expo-router';
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

// Prevent native splash screen from auto-hiding during initial JS bundle evaluation
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
  const [authInitialized, setAuthInitialized] = useState(false);
  const isSplashHidden = useRef(false);

  const [fontsLoaded, fontError] = useFonts({
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

  // Restore authentication token once on initial mount
  useEffect(() => {
    let isMounted = true;
    restoreToken().finally(() => {
      if (isMounted) {
        setAuthInitialized(true);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const appIsReady = (fontsLoaded || fontError != null) && authInitialized && !isLoading;

  // Single controlled, idempotent splash screen dismissal owned exclusively by root layout
  useEffect(() => {
    if (!appIsReady || isSplashHidden.current) return;

    isSplashHidden.current = true;

    async function hideSplash() {
      try {
        await SplashScreen.hideAsync();
      } catch (err) {
        // Native splash screen may already be dismissed or unavailable on current view controller
      }
    }

    hideSplash();
  }, [appIsReady]);

  if (!appIsReady) {
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
        <Stack.Screen name="auth" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
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
