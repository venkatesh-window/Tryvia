import { useEffect } from 'react';
import { Stack, useRouter, useSegments, ErrorBoundary, useRootNavigationState } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '../src/store/useAuthStore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { View, StyleSheet, LogBox } from 'react-native';
import { useTheme } from '../src/hooks/useTheme';
import { useFonts, CormorantGaramond_400Regular, CormorantGaramond_700Bold } from '@expo-google-fonts/cormorant-garamond';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { DancingScript_400Regular, DancingScript_700Bold } from '@expo-google-fonts/dancing-script';

SplashScreen.preventAutoHideAsync();
LogBox.ignoreLogs(['SafeAreaView has been deprecated']);

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { isLoading, restoreToken } = useAuthStore();
  const theme = useTheme();
  const navigationState = useRootNavigationState();

  let [fontsLoaded] = useFonts({
    CormorantGaramond_400Regular,
    CormorantGaramond_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    DancingScript_400Regular,
    DancingScript_700Bold,
  });

  useEffect(() => {
    restoreToken();
  }, []);

  useEffect(() => {
    if (isLoading || !fontsLoaded) return;
    if (!navigationState?.key) return;

    SplashScreen.hideAsync();
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
