import { useEffect } from 'react';
import { Stack, useRouter, useSegments, ErrorBoundary, useRootNavigationState } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '../src/store/useAuthStore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { View, StyleSheet, LogBox } from 'react-native';
import { useTheme } from '../src/hooks/useTheme';
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

SplashScreen.preventAutoHideAsync();
LogBox.ignoreLogs(['SafeAreaView has been deprecated']);

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { isLoading, restoreToken } = useAuthStore();
  const theme = useTheme();
  const navigationState = useRootNavigationState();

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

  useEffect(() => {
    if (isLoading || !fontsLoaded) return;
    if (!navigationState?.key) return;

    // Safety fallback timer: LandingVideo will hide the splash screen immediately when the video is readyToPlay,
    // but in case the user navigates elsewhere or video takes too long, hide after 3 seconds.
    const timer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 3000);

    return () => clearTimeout(timer);
  }, [isLoading, fontsLoaded, navigationState?.key]);

  if (isLoading || !fontsLoaded) {
    return <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background.default }]} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="landing" options={{ animation: 'fade' }} />
        <Stack.Screen 
          name="(tabs)" 
          options={{ 
            animation: 'fade', 
            animationDuration: 700 
          }} 
        />
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
