import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Typography } from '../../src/components/ui/Typography';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useRouter } from 'expo-router';

export default function VendorApplyScreen() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const [form, setForm] = useState({
    storeName: '',
    description: '',
    email: user?.email || '',
    phone: '',
    slug: '',
    gst: '',
    pan: ''
  });

  useEffect(() => {
    // Check if already applied
    const checkStatus = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/v1/vendor/application', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setStatus(data.status);
          if (data.status === 'APPROVED') {
            router.replace('/vendor/dashboard');
          }
        }
      } catch (e) {
        // Expected to fail if vendor doesn't exist yet
      }
    };
    checkStatus();
  }, [token]);

  const handleSubmit = async () => {
    if (!form.storeName || !form.email || !form.slug) {
      setError('Store Name, Email, and Slug are required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/api/v1/vendor/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to submit application');
      }
      
      setStatus('PENDING');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'PENDING') {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <View style={styles.card}>
          <Typography style={styles.title}>Application Submitted</Typography>
          <Typography style={styles.subtitle}>
            Your TRYVIA vendor application is under review. You will be notified once approved.
          </Typography>
          <TouchableOpacity style={[styles.btn, { marginTop: 20 }]} onPress={() => router.replace('/')}>
            <Typography style={styles.btnText}>Return to Home</Typography>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (status === 'REJECTED') {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <View style={styles.card}>
          <Typography style={[styles.title, { color: '#D9383A' }]}>Application Rejected</Typography>
          <Typography style={styles.subtitle}>
            Unfortunately, your vendor application was not approved at this time.
          </Typography>
        </View>
      </View>
    );
  }
  
  if (status === 'SUSPENDED') {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <View style={styles.card}>
          <Typography style={[styles.title, { color: '#D9383A' }]}>Account Suspended</Typography>
          <Typography style={styles.subtitle}>
            Your vendor account has been suspended. Please contact support.
          </Typography>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Typography style={styles.title}>Become a Vendor</Typography>
          <Typography style={styles.subtitle}>Partner with TRYVIA to sell your beauty products.</Typography>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Typography style={styles.errorText}>{error}</Typography>
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Typography style={styles.inputLabel}>STORE NAME</Typography>
            <View style={styles.inputWrapper}>
              <TextInput style={styles.input} value={form.storeName} onChangeText={(val) => setForm({...form, storeName: val})} placeholder="Your Brand Name" />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Typography style={styles.inputLabel}>STORE SLUG (URL)</Typography>
            <View style={styles.inputWrapper}>
              <Typography style={{ color: '#8E8A85', marginRight: 4 }}>tryvia.com/store/</Typography>
              <TextInput style={styles.input} value={form.slug} onChangeText={(val) => setForm({...form, slug: val.toLowerCase().replace(/[^a-z0-9-]/g, '-')})} placeholder="your-brand" />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Typography style={styles.inputLabel}>EMAIL ADDRESS</Typography>
            <View style={styles.inputWrapper}>
              <TextInput style={styles.input} value={form.email} onChangeText={(val) => setForm({...form, email: val})} keyboardType="email-address" />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Typography style={styles.inputLabel}>PHONE NUMBER</Typography>
            <View style={styles.inputWrapper}>
              <TextInput style={styles.input} value={form.phone} onChangeText={(val) => setForm({...form, phone: val})} keyboardType="phone-pad" />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Typography style={styles.inputLabel}>BRAND DESCRIPTION</Typography>
            <View style={[styles.inputWrapper, { height: 100, alignItems: 'flex-start', paddingTop: 12 }]}>
              <TextInput 
                style={[styles.input, { textAlignVertical: 'top' }]} 
                value={form.description} 
                onChangeText={(val) => setForm({...form, description: val})}
                multiline
                numberOfLines={4}
              />
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Typography style={[styles.inputLabel, { marginBottom: 16 }]}>BUSINESS VERIFICATION (Optional for now)</Typography>
          
          <View style={styles.inputGroup}>
            <Typography style={styles.inputLabel}>GST NUMBER</Typography>
            <View style={styles.inputWrapper}>
              <TextInput style={styles.input} value={form.gst} onChangeText={(val) => setForm({...form, gst: val})} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Typography style={styles.inputLabel}>PAN NUMBER</Typography>
            <View style={styles.inputWrapper}>
              <TextInput style={styles.input} value={form.pan} onChangeText={(val) => setForm({...form, pan: val})} />
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.btn} activeOpacity={0.8} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Typography style={styles.btnText}>Submit Application</Typography>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF8F5' },
  header: { marginBottom: 24 },
  title: { fontFamily: 'CormorantGaramond_700Bold', fontSize: 28, color: '#1A1918', marginBottom: 8 },
  subtitle: { fontFamily: 'Inter_500Medium', fontSize: 14, color: '#8E8A85', lineHeight: 20 },
  scrollContent: { padding: 24, paddingBottom: 40, gap: 20 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#ECE7E1' },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 10.5, color: '#8E8A85', letterSpacing: 1.2, marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAF8F5', borderRadius: 12, borderWidth: 1, borderColor: '#ECE7E1', paddingHorizontal: 14, height: 48 },
  input: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 14, color: '#1A1918' },
  errorBox: { backgroundColor: '#FDECEC', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#F8B4B4' },
  errorText: { color: '#D9383A', fontFamily: 'Inter_500Medium', fontSize: 14 },
  btn: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#1A1918', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 8 },
  btnText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#FFFFFF' },
});
