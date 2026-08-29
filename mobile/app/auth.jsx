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
import * as Haptics from "expo-haptics";

export default function AuthScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { login: setAuthUser } = useAuthStore();

  const [mode, setMode] = useState("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState(null);
  const [signUpRole, setSignUpRole] = useState("CUSTOMER");

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

  const roleFieldStyle = useAnimatedStyle(() => ({
    height: signupFieldsProgress.value * 70,
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
        signUpRole,
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

    try {
      const result = await ClerkService.signInWithGoogle();

      if (result.status === "failed") {
        setError(
          result.error || "Google authentication was cancelled or failed.",
        );
        setGoogleLoading(false);
        return;
      }

      // Google Auth is not fully configured, should never reach here since status is failed.
      if (result.user && result.token) {
        await setAuthUser(result.token, result.user);
        if (result.user?.role === "VENDOR") {
          router.replace("/vendor");
        } else if (router.canGoBack()) {
          router.back();
        } else {
          router.replace("/(tabs)");
        }
      }
    } catch (err) {
      setError(err?.message || "Google Sign-In failed.");
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

          {/* Role Selection (Smooth Slide Open / Collapse) */}
          <Animated.View
            style={[
              styles.inputGroup,
              signupFieldStyle,
              roleFieldStyle,
            ]}
          >
            <Typography style={styles.inputLabel}>ACCOUNT TYPE</Typography>
            <View style={styles.roleSwitcherTrack}>
              <TouchableOpacity
                style={[
                  styles.roleTab,
                  signUpRole === "CUSTOMER" && styles.roleTabActive,
                ]}
                activeOpacity={0.8}
                onPress={() => {
                  if (Platform.OS === "ios") Haptics.selectionAsync();
                  setSignUpRole("CUSTOMER");
                }}
              >
                <Typography
                  style={[
                    styles.roleText,
                    signUpRole === "CUSTOMER" && styles.roleTextActive,
                  ]}
                >
                  Shopper
                </Typography>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.roleTab,
                  signUpRole === "VENDOR" && styles.roleTabActive,
                ]}
                activeOpacity={0.8}
                onPress={() => {
                  if (Platform.OS === "ios") Haptics.selectionAsync();
                  setSignUpRole("VENDOR");
                }}
              >
                <Typography
                  style={[
                    styles.roleText,
                    signUpRole === "VENDOR" && styles.roleTextActive,
                  ]}
                >
                  Vendor
                </Typography>
              </TouchableOpacity>
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
