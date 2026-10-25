import "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useEffect, useState, useRef } from "react";
import { ClerkProvider, useUser, useSession, useClerk } from "@clerk/clerk-expo";
import { tokenCache } from "../src/utils/tokenCache";
import { ClerkService } from "../src/services/clerkService";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error("Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env");
}
import { Stack, ErrorBoundary } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useAuthStore } from "../src/store/useAuthStore";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { View, StyleSheet, LogBox } from "react-native";
import {
  useFonts,
  CormorantGaramond_300Light,
  CormorantGaramond_400Regular,
  CormorantGaramond_500Medium,
  CormorantGaramond_600SemiBold,
  CormorantGaramond_700Bold,
  CormorantGaramond_400Regular_Italic,
  CormorantGaramond_700Bold_Italic,
} from "@expo-google-fonts/cormorant-garamond";
import {
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from "@expo-google-fonts/inter";

// Prevent native splash screen from auto-hiding during initial JS bundle evaluation
SplashScreen.preventAutoHideAsync().catch(() => {});
LogBox.ignoreLogs(["SafeAreaView has been deprecated"]);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
    },
  },
});

function ClerkAuthSyncBridge() {
  const { user: clerkUser, isSignedIn: isClerkSignedIn, isLoaded: isUserLoaded } = useUser();
  const { session: clerkSession, isLoaded: isSessionLoaded } = useSession();
  const clerk = useClerk();
  const { isAuthenticated, login: setAuthUser } = useAuthStore();
  const isSyncingRef = useRef(false);

  useEffect(() => {
    if ((!isUserLoaded && !isSessionLoaded) || isSyncingRef.current || isAuthenticated) return;

    let email =
      clerkUser?.primaryEmailAddress?.emailAddress ||
      clerkUser?.emailAddresses?.[0]?.emailAddress ||
      clerkSession?.publicUserData?.identifier ||
      clerk?.session?.publicUserData?.identifier;

    if (!email && clerk?.client?.sessions) {
      for (const s of clerk.client.sessions) {
        if (s.publicUserData?.identifier && s.publicUserData.identifier.includes("@")) {
          email = s.publicUserData.identifier;
          break;
        }
      }
    }

    if (!email || !email.includes("@")) return;

    const fullName =
      clerkUser?.fullName ||
      `${clerkUser?.firstName || ""} ${clerkUser?.lastName || ""}`.trim() ||
      clerkSession?.publicUserData?.firstName ||
      clerk?.session?.publicUserData?.firstName ||
      "";

    isSyncingRef.current = true;
    ClerkService.syncOAuthUser(email, fullName)
      .then(async (result) => {
        if (result.status !== "failed" && result.user && result.token) {
          await setAuthUser(result.token, result.user);
        }
      })
      .catch((err) => {
        console.warn("ClerkAuthSyncBridge background sync error:", err);
      })
      .finally(() => {
        isSyncingRef.current = false;
      });
  }, [isUserLoaded, isSessionLoaded, isClerkSignedIn, clerkUser, clerkSession, clerk?.session, isAuthenticated]);

  return null;
}

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

  const appIsReady =
    (fontsLoaded || fontError != null) && authInitialized && !isLoading;

  // Single controlled splash screen dismissal with 2.5s fallback safety
  useEffect(() => {
    async function hideSplash() {
      if (isSplashHidden.current) return;
      isSplashHidden.current = true;
      try {
        await SplashScreen.hideAsync();
      } catch (err) {}
    }

    if (appIsReady) {
      hideSplash();
    }

    const fallbackTimer = setTimeout(() => {
      hideSplash();
    }, 2500);

    return () => clearTimeout(fallbackTimer);
  }, [appIsReady]);

  if (!appIsReady) {
    return <View style={styles.loadingContainer} />;
  }

  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
      <ClerkAuthSyncBridge />
      <GestureHandlerRootView style={styles.root}>
        <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ animation: "fade" }} />
          <Stack.Screen name="landing" options={{ animation: "fade" }} />
          <Stack.Screen
            name="(tabs)"
            options={{
              animation: "fade",
              animationDuration: 500,
            }}
          />

          <Stack.Screen name="product/[id]" />
          <Stack.Screen name="tester/[id]" />
          <Stack.Screen
            name="auth"
            options={{ presentation: "modal", animation: "slide_from_bottom" }}
          />
          <Stack.Screen name="cart" options={{ presentation: "modal" }} />
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
    </ClerkProvider>
  );
}

export { ErrorBoundary };
export default RootLayoutNav;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
});
