import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Typography } from '../../src/components/ui/Typography';
import { useAuthStore } from '../../src/store/useAuthStore';
import { ArrowLeft, Mail, Lock, Sparkles, AlertCircle } from 'lucide-react-native';

export default function VendorLoginScreen() {
  const router = useRouter();
  const { login: setAuthUser } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Invalid credentials');
      }

      if (data.user?.role !== 'VENDOR') {
        throw new Error('This account is not authorized as a vendor.');
      }

      await setAuthUser(data.token, data.user);
      router.replace('/vendor/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backBtn}
            activeOpacity={0.7}
            onPress={() => router.replace('/')}
          >
            <ArrowLeft size={20} color="#1A1918" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Image
              source={require('../../assets/images/main-logo.png')}
              style={styles.logoImage}
              contentFit="contain"
            />
          </View>
          <Typography style={styles.brandTitle}>TryVia</Typography>
          <Typography style={styles.brandSubtitle}>VENDOR PORTAL</Typography>
          <Typography style={styles.welcomeText}>
            Welcome back, Vendor. Manage your TRYVIA store from one place.
          </Typography>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <AlertCircle size={16} color="#D9383A" strokeWidth={2} />
            <Typography style={styles.errorText}>{error}</Typography>
          </View>
        )}

        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Typography style={styles.inputLabel}>EMAIL ADDRESS</Typography>
            <View style={styles.inputWrapper}>
              <Mail size={18} color="#8E8A85" strokeWidth={1.75} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="vendor@tryvia.com"
                placeholderTextColor="#B0AAA2"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Typography style={styles.inputLabel}>PASSWORD</Typography>
            <View style={styles.inputWrapper}>
              <Lock size={18} color="#8E8A85" strokeWidth={1.75} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#B0AAA2"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.submitBtn}
            activeOpacity={0.85}
            disabled={loading}
            onPress={handleSignIn}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Sparkles size={16} color="#FCEEF0" strokeWidth={2} />
                <Typography style={styles.submitBtnText}>
                  Sign In to Vendor Portal
                </Typography>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 40,
    alignItems: 'center',
  },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    maxWidth: 400,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE7E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    maxWidth: 400,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE7E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#CB6D73',
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
    fontFamily: 'CormorantGaramond_700Bold',
    fontSize: 34,
    color: '#1A1918',
    letterSpacing: 1,
    marginBottom: 4,
  },
  brandSubtitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    color: '#CB6D73',
    letterSpacing: 2.5,
    marginBottom: 16,
  },
  welcomeText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#8E8A85',
    textAlign: 'center',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDECEC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F8B4B4',
    gap: 8,
    width: '100%',
    maxWidth: 400,
  },
  errorText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: '#D9383A',
    flex: 1,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 24,
    borderWidth: 1,
    borderColor: '#ECE7E1',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    width: '100%',
    maxWidth: 400,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10.5,
    color: '#8E8A85',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ECE7E1',
    paddingHorizontal: 14,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#1A1918',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1918',
    borderRadius: 26,
    height: 52,
    marginTop: 8,
    gap: 8,
  },
  submitBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
