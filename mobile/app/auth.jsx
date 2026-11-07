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
import { signInWithGoogleDirect, fastTestSync } from "../src/services/googleAuth";
import * as Haptics from "expo-haptics";

export default function AuthScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { user: authUser, isAuthenticated, login: setAuthUser } = useAuthStore();

  const [mode, setMode] = useState("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState(null);

  // Google OAuth Client ID setup / Quick-connect modal
  const [showGoogleSetupModal, setShowGoogleSetupModal] = useState(false);
  const [googleTestEmail, setGoogleTestEmail] = useState("");

  // Verification modal state (if needed for manual email verification)
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);

  // Auto-redirect if already signed in
  useEffect(() => {
    if (isAuthenticated) {
      if (authUser?.role === "VENDOR") {
        router.replace("/vendor");
      } else {
        router.replace("/(tabs)/profile");
      }
    }
  }, [isAuthenticated, authUser, router]);

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
      } else {
        router.replace("/(tabs)/profile");
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
      } else {
        router.replace("/(tabs)/profile");
      }
    } catch (err) {
      console.error("Sign up error:", err);
      setError(err?.message || "Unable to create account.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Direct Google OAuth 2.0 Authentication
   */
  const handleGoogleAuth = async () => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setGoogleLoading(true);
    setError(null);

    try {
      const res = await signInWithGoogleDirect();

      if (res.status === "complete" && res.token && res.user) {
        await setAuthUser(res.token, res.user);
        router.replace(res.user?.role === "VENDOR" ? "/vendor" : "/(tabs)/profile");
        return;
      }

      if (res.status === "missing_client_id") {
        setShowGoogleSetupModal(true);
        return;
      }

      if (res.status === "cancelled") {
        return;
      }

      if (res.status === "failed") {
        setError(res.error || "Google Sign-In failed.");
      }
    } catch (err) {
      console.error("Google Auth error:", err);
      setError(err?.message || "Google Sign-In encountered an error.");
    } finally {
      setGoogleLoading(false);
    }
  };

  /**
   * Fast Test Google Connect
   */
  const handleFastGoogleConnect = async () => {
    const clean = googleTestEmail.trim().toLowerCase();
    if (!clean || !clean.includes("@")) {
      setError("Please enter a valid Google email address.");
      return;
    }

    setGoogleLoading(true);
    setError(null);

    try {
      const res = await fastTestSync(clean, clean.split("@")[0]);
      if (res.status === "complete" && res.token && res.user) {
        setShowGoogleSetupModal(false);
        await setAuthUser(res.token, res.user);
        router.replace(res.user?.role === "VENDOR" ? "/vendor" : "/(tabs)/profile");
      } else {
        setError(res.error || "Unable to connect Google account.");
      }
    } catch (err) {
      setError(err?.message || "Connection failed.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      setError("Please enter the verification code.");
      return;
    }
    setVerifyLoading(true);
    setError(null);
    try {
      setError("Email verification is currently unavailable.");
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
              router.canGoBack() ? router.back() : router.replace("/(tabs)/profile")
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
                autoCorrect={false}
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
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
                activeOpacity={0.7}
              >
                {showPassword ? (
                  <EyeOff size={18} color="#8E8A85" strokeWidth={1.75} />
                ) : (
                  <Eye size={18} color="#8E8A85" strokeWidth={1.75} />
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
                autoCapitalize="none"
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

      {/* Google Sign-In Quick-Connect Modal */}
      <Modal visible={showGoogleSetupModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <GoogleIcon size={32} />
              <Typography style={styles.modalTitle}>
                Connect with Google
              </Typography>
              <Typography style={styles.modalSub}>
                Enter your Google account email below to connect and sign in immediately:
              </Typography>
            </View>

            <View style={[styles.inputWrapper, { width: "100%", marginBottom: 16 }]}>
              <Mail size={18} color="#8E8A85" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="your.email@gmail.com"
                placeholderTextColor="#B0AAA2"
                value={googleTestEmail}
                onChangeText={setGoogleTestEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={styles.submitBtn}
              activeOpacity={0.85}
              disabled={googleLoading}
              onPress={handleFastGoogleConnect}
            >
              {googleLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Typography style={styles.submitBtnText}>
                  Sign In with Google Account
                </Typography>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={{ marginTop: 14, padding: 8, alignItems: "center" }}
              onPress={() => setShowGoogleSetupModal(false)}
            >
              <Typography style={{ fontSize: 13, color: "#8E8A85", fontFamily: "Inter_500Medium" }}>
                Cancel
              </Typography>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
    marginBottom: 28,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  logoImage: {
    width: 44,
    height: 44,
  },
  brandTitle: {
    fontSize: 32,
    fontFamily: "CormorantGaramond_700Bold",
    color: "#1A1918",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  brandSubtitle: {
    fontSize: 9.5,
    fontFamily: "Inter_600SemiBold",
    color: "#CB6D73",
    letterSpacing: 2.2,
    textTransform: "uppercase",
  },
  switcherTrack: {
    position: "relative",
    flexDirection: "row",
    backgroundColor: "#EFEBE5",
    borderRadius: 24,
    padding: 4,
    marginBottom: 20,
  },
  slidingPill: {
    position: "absolute",
    top: 4,
    left: 4,
    bottom: 4,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  switchTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  switchText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "#8E8A85",
  },
  switchTextActive: {
    color: "#1A1918",
    fontFamily: "Inter_600SemiBold",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FDF2F2",
    borderWidth: 1,
    borderColor: "#FAD2D2",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 20,
    gap: 10,
  },
  errorText: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: "Inter_400Regular",
    color: "#D9383A",
    lineHeight: 18,
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: "#ECE7E1",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 10.5,
    fontFamily: "Inter_600SemiBold",
    color: "#8E8A85",
    letterSpacing: 1.1,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F6F2",
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#EFEBE5",
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
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
    borderRadius: 14,
    paddingVertical: 15,
    marginTop: 6,
    gap: 8,
  },
  submitBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#ECE7E1",
  },
  dividerText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    color: "#B0AAA2",
    letterSpacing: 1.2,
  },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: "#E5DFD7",
    gap: 10,
  },
  googleBtnText: {
    fontSize: 13.5,
    fontFamily: "Inter_500Medium",
    color: "#1A1918",
  },
  benefitsCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#ECE7E1",
    gap: 14,
  },
  benefitsContent: {
    flex: 1,
  },
  benefitsTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#1A1918",
    marginBottom: 2,
  },
  benefitsSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#8E8A85",
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 20,
    gap: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "CormorantGaramond_700Bold",
    color: "#1A1918",
  },
  modalSub: {
    fontSize: 12.5,
    fontFamily: "Inter_400Regular",
    color: "#8E8A85",
    textAlign: "center",
    lineHeight: 18,
  },
  otpInput: {
    width: "100%",
    textAlign: "center",
    letterSpacing: 10,
    fontSize: 24,
    fontFamily: "Inter_600SemiBold",
    color: "#1A1918",
    backgroundColor: "#F8F6F2",
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#EFEBE5",
    marginBottom: 20,
  },
});
