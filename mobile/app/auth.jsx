import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { Typography } from "../src/components/ui/Typography";
import { useAuthStore } from "../src/store/useAuthStore";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from "react-native-reanimated";
import {
  ArrowLeft,
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from "lucide-react-native";
import { GoogleIcon } from "../src/components/ui/GoogleIcon";
import { ClerkService } from "../src/services/clerkService";
import { tokenCache } from "../src/utils/tokenCache";
import * as Haptics from "expo-haptics";
import { useOAuth, useClerk, useUser, useSession } from "@clerk/clerk-expo";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";

WebBrowser.maybeCompleteAuthSession();

// Pure JS base64 JWT payload decoder that runs safely in any React Native engine
function decodeJwt(token) {
  if (!token || typeof token !== "string") return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    let str = "";
    for (let i = 0; i < base64.length; i += 4) {
      const enc1 = chars.indexOf(base64.charAt(i));
      const enc2 = chars.indexOf(base64.charAt(i + 1));
      const enc3 = chars.indexOf(base64.charAt(i + 2));
      const enc4 = chars.indexOf(base64.charAt(i + 3));
      if (enc1 === -1 || enc2 === -1) break;
      const chr1 = (enc1 << 2) | (enc2 >> 4);
      const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
      const chr3 = ((enc3 & 3) << 6) | enc4;
      str += String.fromCharCode(chr1);
      if (enc3 !== 64 && enc3 !== -1) str += String.fromCharCode(chr2);
      if (enc4 !== 64 && enc4 !== -1) str += String.fromCharCode(chr3);
    }
    return JSON.parse(str);
  } catch (_) {
    return null;
  }
}

// Recursive deep search for email and name anywhere inside an arbitrary Clerk object or response tree
function findEmailAndName(obj, maxDepth = 6) {
  let foundEmail = "";
  let foundName = "";

  function walk(curr, depth) {
    if (!curr || depth > maxDepth || (foundEmail && foundName)) return;
    if (typeof curr === "string") {
      const s = curr.trim();
      if (!foundEmail && s.includes("@") && s.includes(".") && !s.includes(" ") && s.length < 100) {
        foundEmail = s.toLowerCase();
      }
      return;
    }
    if (typeof curr !== "object") return;

    if (Array.isArray(curr)) {
      for (const item of curr) walk(item, depth + 1);
      return;
    }

    if (!foundName && (curr.fullName || curr.full_name)) {
      const n = String(curr.fullName || curr.full_name).trim();
      if (n) foundName = n;
    } else if (!foundName && (curr.firstName || curr.first_name)) {
      const first = curr.firstName || curr.first_name || "";
      const last = curr.lastName || curr.last_name || "";
      const n = `${first} ${last}`.trim();
      if (n) foundName = n;
    }

    if (!foundEmail && (curr.emailAddress || curr.email_address || curr.email || curr.identifier)) {
      const val = curr.emailAddress || curr.email_address || curr.email || curr.identifier;
      if (typeof val === "string" && val.includes("@") && val.includes(".")) {
        foundEmail = val.trim().toLowerCase();
      }
    }

    for (const key of Object.keys(curr)) {
      if (key === "clerk" || key === "_clerk" || key === "parent") continue;
      walk(curr[key], depth + 1);
    }
  }

  walk(obj, 0);
  return { email: foundEmail, fullName: foundName };
}

// Multi-phase asynchronous profile resolver that activates existing sessions and polls for profile data
async function resolveClerkProfile(clerk, targetSessionId, flowResult, maxAttempts = 15) {
  for (let i = 0; i < maxAttempts; i++) {
    // 1. From flowResult
    if (flowResult) {
      const r = findEmailAndName({ signUp: flowResult.signUp, signIn: flowResult.signIn });
      if (r.email) return r;
    }

    // 2. From clerk.user (the most authoritative source in Clerk)
    if (clerk?.user) {
      const r = findEmailAndName(clerk.user);
      if (r.email) return r;
    }

    // 3. From clerk.session
    if (clerk?.session) {
      const r = findEmailAndName(clerk.session);
      if (r.email) return r;
    }

    // 4. From clerk.client.sessions
    if (clerk?.client?.sessions && Array.isArray(clerk.client.sessions)) {
      for (const s of clerk.client.sessions) {
        const r = findEmailAndName(s);
        if (r.email) {
          if (clerk.setActive && s.id && clerk.session?.id !== s.id) {
            try {
              await clerk.setActive({ session: s.id });
            } catch (_) {}
          }
          return r;
        }
      }
    }

    // 5. If we have sessions but no active session, activate it
    if (clerk?.client?.sessions?.length && !clerk.session && clerk.setActive) {
      try {
        const sid = targetSessionId || clerk.client.lastActiveSessionId || clerk.client.sessions[0]?.id;
        if (sid) {
          await clerk.setActive({ session: sid });
        }
      } catch (_) {}
    }

    // 6. Refresh clerk client state from server
    if (clerk?.client?.fetch && i % 2 === 1) {
      try {
        await clerk.client.fetch();
      } catch (_) {}
    }

    if (i < maxAttempts - 1) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  // 7. Direct FAPI query using cached client JWT
  try {
    const clientJwt = await tokenCache.getToken("__clerk_client_jwt");
    if (clientJwt) {
      const resp = await fetch(
        "https://amazing-humpback-4840.clerk.accounts.dev/v1/client?_is_native=1",
        {
          headers: {
            authorization: clientJwt,
            "x-mobile": "1",
          },
        }
      );
      if (resp.ok) {
        const data = await resp.json();
        const r = findEmailAndName(data);
        if (r.email) return r;
      }
    }
  } catch (_) {}

  return { email: "", fullName: "" };
}

export default function AuthScreen() {
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const clerk = useClerk();
  const { signOut } = clerk;
  const { user: clerkUser } = useUser();
  const { session: clerkSession } = useSession();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { user: authUser, isAuthenticated, login: setAuthUser } = useAuthStore();

  // Warm up native in-app browser for fastest OAuth popup experience
  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      if (authUser?.role === "VENDOR") {
        router.replace("/vendor");
      } else {
        router.replace("/(tabs)");
      }
    }
  }, [isAuthenticated, authUser]);

  // Auto-sync any existing Clerk session when the auth screen opens
  useEffect(() => {
    let isCancelled = false;
    async function checkExistingClerkSession() {
      if (isAuthenticated) return;
      const profile = await resolveClerkProfile(clerk, null, null, 3);

      if (profile.email && !isCancelled) {
        setGoogleLoading(true);
        try {
          const result = await ClerkService.syncOAuthUser(profile.email, profile.fullName);
          if (!isCancelled && result.status !== "failed" && result.user && result.token) {
            await setAuthUser(result.token, result.user);
            if (result.user?.role === "VENDOR") {
              router.replace("/vendor");
            } else {
              router.replace("/(tabs)");
            }
          }
        } catch (err) {
          console.warn("Auto-sync existing session error:", err);
        } finally {
          if (!isCancelled) setGoogleLoading(false);
        }
      }
    }
    checkExistingClerkSession();
    return () => {
      isCancelled = true;
    };
  }, [clerkUser, clerkSession, clerk?.session, isAuthenticated]);

  const [mode, setMode] = useState("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState(null);

  // Verification modal state
  const [isVerifying, setIsVerifying] = useState(false);
  const [signUpId, setSignUpId] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);

  // Switcher sliding animation
  const switcherWidth = width - 40; // 20px padding on each side
  const tabWidth = (switcherWidth - 8) / 2; // 4px padding inside switcher
  const tabOffset = useSharedValue(0);

  // Collapsible signup fields animation
  const signupFieldsProgress = useSharedValue(0);

  useEffect(() => {
    if (mode === "signin") {
      tabOffset.value = withSpring(0, { damping: 22, stiffness: 240 });
      signupFieldsProgress.value = withTiming(0, {
        duration: 250,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    } else {
      tabOffset.value = withSpring(tabWidth, { damping: 22, stiffness: 240 });
      signupFieldsProgress.value = withTiming(1, {
        duration: 250,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    }
  }, [mode, tabWidth]);

  const slidingPillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tabOffset.value }],
  }));

  const signupFieldStyle = useAnimatedStyle(() => ({
    height: signupFieldsProgress.value * 76,
    opacity: signupFieldsProgress.value,
    marginBottom: signupFieldsProgress.value * 16,
    overflow: "hidden",
  }));

  const handleSignIn = async () => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setError("Please enter both email and password.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setError(null);
    setLoading(true);

    try {
      const result = await ClerkService.signIn(cleanEmail, cleanPassword);

      if (result.status === "failed" || !result.token) {
        setError(result.error || "Invalid email or password.");
        setLoading(false);
        return;
      }

      await setAuthUser(result.token, result.user);

      if (result.user?.role === "VENDOR") {
        router.replace("/vendor");
      } else if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/(tabs)");
      }
    } catch (err) {
      console.error("Sign in error:", err);
      setError(err?.message || "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    const cleanName = fullName.trim();

    if (!cleanName || !cleanEmail || !cleanPassword) {
      setError("Please fill in all required fields.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (cleanPassword !== confirmPassword.trim()) {
      setError("Passwords do not match.");
      return;
    }

    if (cleanPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setError(null);
    setLoading(true);

    try {
      const result = await ClerkService.signUp(
        cleanEmail,
        cleanPassword,
        cleanName,
        "CUSTOMER"
      );

      if (result.status === "failed" || !result.token) {
        setError(result.error || "Unable to create account.");
        setLoading(false);
        return;
      }

      await setAuthUser(result.token, result.user);

      if (result.user?.role === "VENDOR") {
        router.replace("/vendor");
      } else if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/(tabs)");
      }
    } catch (err) {
      console.error("Sign up error:", err);
      setError(err?.message || "Unable to create account.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setGoogleLoading(true);
    setError(null);

    // Helper: sync with Tryvia backend and update auth store
    const syncAndNavigate = async (userEmail, userFullName) => {
      const cleanEmail = String(userEmail || "").trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes("@")) return false;
      const cleanName = String(userFullName || "").trim();

      try {
        const result = await ClerkService.syncOAuthUser(cleanEmail, cleanName);
        if (result.status !== "failed" && result.user && result.token) {
          await setAuthUser(result.token, result.user);
          if (result.user?.role === "VENDOR") {
            router.replace("/vendor");
          } else {
            router.replace("/(tabs)");
          }
          return true;
        }
        if (result.status === "failed") {
          setError(result.error || "Google Sign-In failed during server sync.");
        }
      } catch (syncErr) {
        console.error("syncAndNavigate error:", syncErr);
        setError("Unable to connect to Tryvia server. Please check your internet connection.");
      }
      return false;
    };

    try {
      // 1. If user already has an active Clerk session with email, sync immediately
      let profile = await resolveClerkProfile(clerk, null, null, 2);
      if (profile.email) {
        const synced = await syncAndNavigate(profile.email, profile.fullName);
        if (synced) return;
      }

      // 2. Prepare redirect URL explicitly with scheme: 'mobile' and path: 'oauth-native-callback'
      const redirectUrl = Linking.createURL("/oauth-native-callback", {
        scheme: "mobile",
      });

      // 3. Execute OAuth flow
      let flowResult = null;
      try {
        flowResult = await startOAuthFlow({ redirectUrl });
      } catch (flowErr) {
        console.warn("startOAuthFlow caught error:", flowErr);
        const errMsg = (
          flowErr?.errors?.[0]?.message ||
          flowErr?.message ||
          JSON.stringify(flowErr) ||
          ""
        ).toLowerCase();

        const isSessionExists =
          errMsg.includes("already signed in") ||
          errMsg.includes("session_exists") ||
          flowErr?.errors?.[0]?.code === "session_exists";

        if (isSessionExists) {
          // User already has an active session in Clerk!
          // Seamlessly resolve user profile and log them into Tryvia!
          profile = await resolveClerkProfile(clerk, null, null, 10);
          if (profile.email) {
            const synced = await syncAndNavigate(profile.email, profile.fullName);
            if (synced) return;
          }

          // If session could not be resolved, clear ghost session and retry once
          try {
            await tokenCache.clearToken("__clerk_client_jwt");
            await tokenCache.clearToken("clerk_session_token");
            await clerk.signOut();
            if (clerk.client?.removeSessions) {
              await clerk.client.removeSessions();
            }
          } catch (_) {}

          await new Promise((r) => setTimeout(r, 600));

          try {
            flowResult = await startOAuthFlow({ redirectUrl });
          } catch (retryErr) {
            const retryMsg = (
              retryErr?.errors?.[0]?.message ||
              retryErr?.message ||
              ""
            ).toLowerCase();
            if (!retryMsg.includes("cancel") && !retryMsg.includes("dismiss")) {
              setError(
                retryErr?.errors?.[0]?.message ||
                  retryErr?.message ||
                  "Google Sign-In failed."
              );
            }
            return;
          }
        } else if (errMsg.includes("cancel") || errMsg.includes("dismiss")) {
          setError(null);
          return;
        } else {
          setError(
            flowErr?.errors?.[0]?.message ||
              flowErr?.message ||
              "Google Sign-In was interrupted."
          );
          return;
        }
      }

      const { createdSessionId, signIn, signUp, setActive } = flowResult || {};
      const sessionId =
        createdSessionId || signIn?.createdSessionId || signUp?.createdSessionId;

      if (sessionId && setActive) {
        await setActive({ session: sessionId });
      }

      // 4. Resolve email and name across all layers (even if browser dismissed without deep link)
      profile = await resolveClerkProfile(clerk, sessionId, flowResult, 20);

      if (profile.email) {
        const synced = await syncAndNavigate(profile.email, profile.fullName);
        if (!synced) {
          setError("Account sync failed. Please try again.");
        }
      } else {
        // If user explicitly pressed cancel in the browser popup and no session exists, don't show error
        if (flowResult?.authSessionResult?.type === "cancel") {
          setError(null);
          return;
        }
        // If email could not be obtained, clear token to prevent ghost session
        try {
          await tokenCache.clearToken("__clerk_client_jwt");
          await tokenCache.clearToken("clerk_session_token");
          await clerk.signOut();
        } catch (_) {}
        setError("Unable to retrieve email from Google. Please try again.");
      }
    } catch (err) {
      console.error("OAuth error:", err);
      setError(
        err?.errors?.[0]?.message || err?.message || "Google Sign-In failed."
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    setVerifyLoading(true);
    setError(null);

    try {
      // Verification is no longer supported without real backend endpoint.
      setError("Email verification is currently unavailable.");
      setVerifyLoading(false);
      return;
    } catch (err) {
      setError(err?.message || "Invalid verification code.");
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Bar with Back Button */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.topBar}>
          <TouchableOpacity
            style={styles.backBtn}
            activeOpacity={0.7}
            onPress={() =>
              router.canGoBack() ? router.back() : router.replace("/(tabs)")
            }
          >
            <ArrowLeft size={20} color="#1A1918" strokeWidth={2} />
          </TouchableOpacity>
        </Animated.View>

        {/* Brand Emblem & Title */}
        <Animated.View
          entering={FadeInDown.duration(600)}
          style={styles.header}
        >
          <View style={styles.logoBadge}>
            <Image
              source={require("../assets/images/main-logo.png")}
              style={styles.logoImage}
              contentFit="contain"
            />
          </View>
          <Typography style={styles.brandTitle}>TryVia</Typography>
          <Typography style={styles.brandSubtitle}>
            HAUTE PARFUMERIE & LUXURY BEAUTY
          </Typography>
        </Animated.View>

        {/* Fluid Sliding Segmented Switcher */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(100)}
          style={styles.switcherTrack}
        >
          {/* Animated Sliding Pill */}
          <Animated.View
            style={[styles.slidingPill, { width: tabWidth }, slidingPillStyle]}
          />

          <TouchableOpacity
            style={styles.switchTab}
            activeOpacity={0.9}
            onPress={() => {
              if (mode !== "signin") {
                if (Platform.OS === "ios") Haptics.selectionAsync();
                setMode("signin");
                setError(null);
              }
            }}
          >
            <Typography
              style={[
                styles.switchText,
                mode === "signin" && styles.switchTextActive,
              ]}
            >
              Sign In
            </Typography>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchTab}
            activeOpacity={0.9}
            onPress={() => {
              if (mode !== "signup") {
                if (Platform.OS === "ios") Haptics.selectionAsync();
                setMode("signup");
                setError(null);
              }
            }}
          >
            <Typography
              style={[
                styles.switchText,
                mode === "signup" && styles.switchTextActive,
              ]}
            >
              Create Account
            </Typography>
          </TouchableOpacity>
        </Animated.View>

        {/* Error Alert Box */}
        {error && (
          <Animated.View
            entering={FadeIn.duration(250)}
            style={styles.errorBox}
          >
            <AlertCircle size={16} color="#D9383A" strokeWidth={2} />
            <Typography style={styles.errorText}>{error}</Typography>
          </Animated.View>
        )}

        {/* Auth Form Card with Smooth Accordion Fields */}
        <View style={styles.formCard}>
          {/* Full Name (Smooth Slide Open / Collapse) */}
          <Animated.View style={[styles.inputGroup, signupFieldStyle]}>
            <Typography style={styles.inputLabel}>FULL NAME</Typography>
            <View style={styles.inputWrapper}>
              <UserIcon
                size={18}
                color="#8E8A85"
                strokeWidth={1.75}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="e.g. Christian Dior"
                placeholderTextColor="#B0AAA2"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </View>
          </Animated.View>

          {/* Email Address */}
          <View style={styles.inputGroup}>
            <Typography style={styles.inputLabel}>EMAIL ADDRESS</Typography>
            <View style={styles.inputWrapper}>
              <Mail
                size={18}
                color="#8E8A85"
                strokeWidth={1.75}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="name@luxury.com"
                placeholderTextColor="#B0AAA2"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Typography style={styles.inputLabel}>PASSWORD</Typography>
            <View style={styles.inputWrapper}>
              <Lock
                size={18}
                color="#8E8A85"
                strokeWidth={1.75}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#B0AAA2"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />

              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
                hitSlop={8}
              >
                {showPassword ? (
                  <EyeOff size={18} color="#8E8A85" />
                ) : (
                  <Eye size={18} color="#8E8A85" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password (Smooth Slide Open / Collapse) */}
          <Animated.View style={[styles.inputGroup, signupFieldStyle]}>
            <Typography style={styles.inputLabel}>CONFIRM PASSWORD</Typography>
            <View style={styles.inputWrapper}>
              <Lock
                size={18}
                color="#8E8A85"
                strokeWidth={1.75}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#B0AAA2"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
              />
            </View>
          </Animated.View>

          {/* Primary Action Button */}
          <TouchableOpacity
            style={styles.submitBtn}
            activeOpacity={0.85}
            disabled={loading || googleLoading}
            onPress={mode === "signin" ? handleSignIn : handleSignUp}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Sparkles size={16} color="#FCEEF0" strokeWidth={2} />
                <Typography style={styles.submitBtnText}>
                  {mode === "signin"
                    ? "Sign In to TryVia"
                    : "Create Member Account"}
                </Typography>
              </>
            )}
          </TouchableOpacity>

          {/* Social Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Typography style={styles.dividerText}>OR CONTINUE WITH</Typography>
            <View style={styles.dividerLine} />
          </View>

          {/* Sign in with Google Button */}
          <TouchableOpacity
            style={styles.googleBtn}
            activeOpacity={0.85}
            disabled={loading || googleLoading}
            onPress={handleGoogleAuth}
          >
            {googleLoading ? (
              <ActivityIndicator color="#1A1918" size="small" />
            ) : (
              <>
                <GoogleIcon size={19} />
                <Typography style={styles.googleBtnText}>
                  Continue with Google
                </Typography>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Exclusive Benefits Card */}
        <Animated.View
          entering={FadeInUp.duration(400).delay(200)}
          style={styles.benefitsCard}
        >
          <ShieldCheck size={20} color="#CB6D73" strokeWidth={2} />
          <View style={styles.benefitsContent}>
            <Typography style={styles.benefitsTitle}>
              TryVia Membership Perks
            </Typography>
            <Typography style={styles.benefitsSub}>
              90% mini upgrade credit • Luxury authentic formulations •
              Complimentary shipping
            </Typography>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Email Verification Modal */}
      <Modal visible={isVerifying} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <CheckCircle2 size={26} color="#CB6D73" />
              <Typography style={styles.modalTitle}>
                Verify Your Email
              </Typography>
              <Typography style={styles.modalSub}>
                We sent a 6-digit verification code to {email}.
              </Typography>
            </View>

            <TextInput
              style={styles.otpInput}
              placeholder="000000"
              placeholderTextColor="#B0AAA2"
              value={verificationCode}
              onChangeText={setVerificationCode}
              keyboardType="number-pad"
              maxLength={6}
            />

            <TouchableOpacity
              style={styles.submitBtn}
              activeOpacity={0.85}
              disabled={verifyLoading}
              onPress={handleVerifyCode}
            >
              {verifyLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Typography style={styles.submitBtnText}>
                  Verify & Continue
                </Typography>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF8F5",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#ECE7E1",
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 22,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#ECE7E1",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#CB6D73",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  logoImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  brandTitle: {
    fontFamily: "CormorantGaramond_700Bold",
    fontSize: 34,
    color: "#1A1918",
    letterSpacing: 1,
    marginBottom: 4,
  },
  brandSubtitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: "#CB6D73",
    letterSpacing: 2.5,
  },
  switcherTrack: {
    flexDirection: "row",
    backgroundColor: "#EFEAE4",
    borderRadius: 24,
    padding: 4,
    marginBottom: 20,
    position: "relative",
  },
  slidingPill: {
    position: "absolute",
    top: 4,
    left: 4,
    bottom: 4,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  switchTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  switchText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "#8E8A85",
  },
  switchTextActive: {
    fontFamily: "Inter_700Bold",
    color: "#1A1918",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FDECEC",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F8B4B4",
    gap: 8,
  },
  errorText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "#D9383A",
    flex: 1,
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: "#ECE7E1",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10.5,
    color: "#8E8A85",
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAF8F5",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ECE7E1",
    paddingHorizontal: 14,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "#1A1918",
  },
  roleSwitcherTrack: {
    flexDirection: "row",
    backgroundColor: "#FAF8F5",
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: "#ECE7E1",
    height: 48,
  },
  roleTab: {
    flex: 1,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  roleTabActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#ECE7E1",
  },
  roleText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "#8E8A85",
  },
  roleTextActive: {
    fontFamily: "Inter_700Bold",
    color: "#1A1918",
  },
  eyeBtn: {
    padding: 6,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1A1918",
    borderRadius: 26,
    height: 52,
    marginTop: 4,
    gap: 8,
  },
  submitBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 18,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#EFEAE4",
  },
  dividerText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: "#A8A29A",
    letterSpacing: 1.5,
  },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    height: 50,
    borderWidth: 1.2,
    borderColor: "#ECE7E1",
    gap: 10,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  googleBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13.5,
    color: "#1A1918",
    letterSpacing: 0.2,
  },
  benefitsCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAF0F1",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#F2CDD1",
    gap: 12,
  },
  benefitsContent: {
    flex: 1,
  },
  benefitsTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    color: "#1A1918",
    marginBottom: 2,
  },
  benefitsSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: "#8E8A85",
    lineHeight: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: "CormorantGaramond_700Bold",
    fontSize: 24,
    color: "#1A1918",
    marginTop: 8,
    marginBottom: 4,
  },
  modalSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#8E8A85",
    textAlign: "center",
  },
  otpInput: {
    width: "100%",
    height: 54,
    backgroundColor: "#FAF8F5",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ECE7E1",
    textAlign: "center",
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    letterSpacing: 8,
    color: "#1A1918",
    marginBottom: 16,
  },
});
