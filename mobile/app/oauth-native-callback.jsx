import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet, Platform } from "react-native";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useAuthStore } from "../src/store/useAuthStore";
import { authService } from "../src/api/services/authService";

export default function OAuthNativeCallback() {
  const router = useRouter();
  const { isAuthenticated, login: setAuthUser } = useAuthStore();

  useEffect(() => {
    let isCancelled = false;

    async function processCallback() {
      // 1. In-app browser session completion
      if (Platform.OS !== "web") {
        WebBrowser.maybeCompleteAuthSession();
      }

      // 2. Web redirect handling
      if (Platform.OS === "web" && typeof window !== "undefined") {
        const hash = window.location.hash || window.location.search;
        const params = new URLSearchParams(hash.replace(/^[#?]/, ""));
        const accessToken = params.get("access_token");

        if (accessToken) {
          try {
            const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (profileRes.ok) {
              const googleUser = await profileRes.json();
              if (googleUser.email && !isCancelled) {
                const syncRes = await authService.sync({
                  email: googleUser.email,
                  fullName: googleUser.name || googleUser.email.split("@")[0],
                  google_access_token: accessToken,
                });
                if (syncRes?.access_token) {
                  await setAuthUser(syncRes.access_token, syncRes.user);
                  router.replace(syncRes.user?.role === "VENDOR" ? "/vendor" : "/(tabs)/profile");
                  return;
                }
              }
            }
          } catch (e) {
            console.warn("Web OAuth callback processing error:", e);
          }
        }
      }

      // Fallback redirect
      if (!isCancelled) {
        router.replace(isAuthenticated ? "/(tabs)/profile" : "/(tabs)");
      }
    }

    processCallback();

    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated, router, setAuthUser]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#CB6D73" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
});
