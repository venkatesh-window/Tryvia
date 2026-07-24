import { useEffect } from 'react';
import { Stack, useRouter, useSegments, ErrorBoundary, useRootNavigationState } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '../src/store/useAuthStore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../src/hooks/useTheme';
import { useFonts, PlayfairDisplay_400Regular, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { Outfit_400Regular, Outfit_600SemiBold } from '@expo-google-fonts/outfit';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { isAuthenticated, isLoading, restoreToken } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const theme = useTheme();
  const navigationState = useRootNavigationState();

  let [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_700Bold,
    Outfit_400Regular,
    Outfit_600SemiBold,
  });

  useEffect(() => {
    restoreToken();
  }, []);

  useEffect(() => {
    if (isLoading || !fontsLoaded) return;
    if (!navigationState?.key) return;

    // @ts-ignore
    const inAuthGroup = segments[0] === '(auth)';
    
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/onboarding' as any);
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)' as any);
    }

    SplashScreen.hideAsync();
  }, [isAuthenticated, isLoading, segments, fontsLoaded, navigationState?.key]);

  if (isLoading || !fontsLoaded) {
    return <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background.default }]} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="product/[id]" />
        <Stack.Screen name="tester/[id]" />
        <Stack.Screen name="(modals)/cart" options={{ presentation: 'modal' }} />
      </Stack>
    </QueryClientProvider>
  );
}

export { ErrorBoundary };
export default RootLayoutNav;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
  },
});
