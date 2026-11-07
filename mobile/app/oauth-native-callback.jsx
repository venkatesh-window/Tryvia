import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet, Platform } from "react-native";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useClerk, useUser, useSession } from "@clerk/clerk-expo";
import { useAuthStore } from "../src/store/useAuthStore";
import { ClerkService } from "../src/services/clerkService";

export default function OAuthNativeCallback() {
  const router = useRouter();
  const clerk = useClerk();
  const { user: clerkUser } = useUser();
  const { session: clerkSession } = useSession();
  const { isAuthenticated, login: setAuthUser } = useAuthStore();

  useEffect(() => {
    let isCancelled = false;

    async function processCallback() {
      // 1. Native in-app browser resolution
      if (Platform.OS !== "web") {
        WebBrowser.maybeCompleteAuthSession();
      }

      // 2. Web redirect callback processing
      if (Platform.OS === "web") {
        try {
          if (typeof clerk?.handleRedirectCallback === "function") {
            await clerk.handleRedirectCallback({});
          } else if (
            typeof window !== "undefined" &&
            typeof window.Clerk?.handleRedirectCallback === "function"
          ) {
            await window.Clerk.handleRedirectCallback({});
          }
        } catch (cbErr) {
          console.warn("clerk.handleRedirectCallback warning:", cbErr);
        }
      }

      // 3. Resolve user profile across multiple attempts (wait for Clerk to populate)
      let resolvedEmail = "";
      let resolvedName = "";

      for (let attempt = 0; attempt < 12; attempt++) {
        if (isCancelled) return;

        // Check hook states
        if (clerkUser) {
          resolvedEmail =
            clerkUser.primaryEmailAddress?.emailAddress ||
            clerkUser.emailAddresses?.[0]?.emailAddress ||
            "";
          resolvedName =
            clerkUser.fullName ||
            `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim();
        }

        // Check session
        if (!resolvedEmail && clerkSession?.publicUserData?.identifier?.includes("@")) {
          resolvedEmail = clerkSession.publicUserData.identifier;
          resolvedName = clerkSession.publicUserData.firstName || "";
        }

        // Check clerk instance
        if (!resolvedEmail && clerk?.user) {
          resolvedEmail =
            clerk.user.primaryEmailAddress?.emailAddress ||
            clerk.user.emailAddresses?.[0]?.emailAddress ||
            "";
          resolvedName =
            clerk.user.fullName ||
            `${clerk.user.firstName || ""} ${clerk.user.lastName || ""}`.trim();
        }

        // Check window.Clerk (Web)
        if (!resolvedEmail && typeof window !== "undefined" && window.Clerk) {
          const u = window.Clerk.user;
          if (u) {
            resolvedEmail =
              u.primaryEmailAddress?.emailAddress ||
              u.emailAddresses?.[0]?.emailAddress ||
              "";
            resolvedName =
              u.fullName ||
              `${u.firstName || ""} ${u.lastName || ""}`.trim();
          }
          if (!resolvedEmail && window.Clerk.session?.publicUserData?.identifier?.includes("@")) {
            resolvedEmail = window.Clerk.session.publicUserData.identifier;
          }
        }

        if (resolvedEmail && resolvedEmail.includes("@")) {
          break;
        }

        await new Promise((r) => setTimeout(r, 200));
      }

      if (resolvedEmail && !isCancelled) {
        try {
          const result = await ClerkService.syncOAuthUser(resolvedEmail, resolvedName);
          if (!isCancelled && result.status !== "failed" && result.user && result.token) {
            await setAuthUser(result.token, result.user);
            if (result.user?.role === "VENDOR") {
              router.replace("/vendor");
            } else {
              router.replace("/(tabs)/profile");
            }
            return;
          }
        } catch (syncErr) {
          console.warn("OAuthNativeCallback sync error:", syncErr);
        }
      }

      // If already authenticated or sync finished
      if (isAuthenticated && !isCancelled) {
        router.replace("/(tabs)/profile");
        return;
      }

      // Fallback
      if (!isCancelled) {
        router.replace("/(tabs)/profile");
      }
    }

    processCallback();

    return () => {
      isCancelled = true;
    };
  }, [clerk, clerkUser, clerkSession, isAuthenticated, router, setAuthUser]);

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
