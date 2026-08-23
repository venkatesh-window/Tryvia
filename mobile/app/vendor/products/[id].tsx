import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Typography } from '../../../src/components/ui/Typography';
import { ArrowLeft, Save, Image as ImageIcon } from 'lucide-react-native';
import { useAuthStore } from '../../../src/store/useAuthStore';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function EditProductScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    fullPrice: '',
    testerPrice: '',
    stockFull: '',
    stockTester: '',
    imageUrl: '',
    status: 'ACTIVE'
  });

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/v1/vendor/products/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch product');
        }
        
        const json = await response.json();
        setForm({
          name: json.name || '',
          description: json.description || '',
          fullPrice: json.fullPrice?.toString() || '',
          testerPrice: json.testerPrice?.toString() || '',
          stockFull: json.stockFull?.toString() || '',
          stockTester: json.stockTester?.toString() || '',
          imageUrl: json.imageUrl || '',
          status: json.status || 'ACTIVE'
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) fetchProduct();
  }, [id, token]);

  const handleSave = async () => {
    if (!form.name || !form.fullPrice) {
      setError('Name and Full Price are required.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        name: form.name,
        description: form.description,
        fullPrice: Number(form.fullPrice) || 0,
        testerPrice: Number(form.testerPrice) || 0,
        stockFull: Number(form.stockFull) || 0,
        stockTester: Number(form.stockTester) || 0,
        imageUrl: form.imageUrl,
        status: form.status,
      };

      const response = await fetch(`http://localhost:8000/api/v1/vendor/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update product');
      }
      
      router.back();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#CB6D73" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={20} color="#1A1918" />
          </TouchableOpacity>
          <View>
            <Typography style={styles.title}>Edit Product</Typography>
            <Typography style={styles.subtitle}>Update product information and inventory</Typography>
          </View>
        </View>
        <TouchableOpacity style={styles.saveBtn} activeOpacity={0.8} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Save size={16} color="#FFFFFF" />
              <Typography style={styles.saveBtnText}>Save Changes</Typography>
            </>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {error && (
          <View style={styles.errorBox}>
            <Typography style={styles.errorText}>{error}</Typography>
          </View>
        )}

        <View style={styles.card}>
          <Typography style={styles.cardTitle}>Basic Information</Typography>
          <View style={styles.inputGroup}>
            <Typography style={styles.inputLabel}>PRODUCT NAME</Typography>
            <View style={styles.inputWrapper}>
              <TextInput style={styles.input} value={form.name} onChangeText={(val) => setForm({...form, name: val})} />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Typography style={styles.inputLabel}>DESCRIPTION</Typography>
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
          <Typography style={styles.cardTitle}>Media</Typography>
          <View style={styles.imageUploadBox}>
            <ImageIcon size={32} color="#B0AAA2" />
            <Typography style={{ color: '#8E8A85', marginTop: 8, fontFamily: 'Inter_500Medium' }}>Upload New Image</Typography>
          </View>
          <View style={[styles.inputGroup, { marginTop: 16 }]}>
            <Typography style={styles.inputLabel}>IMAGE URL</Typography>
            <View style={styles.inputWrapper}>
              <TextInput style={styles.input} value={form.imageUrl} onChangeText={(val) => setForm({...form, imageUrl: val})} />
            </View>
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.card, { flex: 1 }]}>
            <Typography style={styles.cardTitle}>Pricing</Typography>
            <View style={styles.inputGroup}>
              <Typography style={styles.inputLabel}>FULL SIZE PRICE ($)</Typography>
              <View style={styles.inputWrapper}>
                <TextInput style={styles.input} value={form.fullPrice} onChangeText={(val) => setForm({...form, fullPrice: val})} keyboardType="decimal-pad" />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Typography style={styles.inputLabel}>TESTER PRICE ($)</Typography>
              <View style={styles.inputWrapper}>
                <TextInput style={styles.input} value={form.testerPrice} onChangeText={(val) => setForm({...form, testerPrice: val})} keyboardType="decimal-pad" />
              </View>
            </View>
          </View>

          <View style={[styles.card, { flex: 1 }]}>
            <Typography style={styles.cardTitle}>Inventory</Typography>
            <View style={styles.inputGroup}>
              <Typography style={styles.inputLabel}>FULL SIZE STOCK</Typography>
              <View style={styles.inputWrapper}>
                <TextInput style={styles.input} value={form.stockFull} onChangeText={(val) => setForm({...form, stockFull: val})} keyboardType="number-pad" />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Typography style={styles.inputLabel}>TESTER STOCK</Typography>
              <View style={styles.inputWrapper}>
                <TextInput style={styles.input} value={form.stockTester} onChangeText={(val) => setForm({...form, stockTester: val})} keyboardType="number-pad" />
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.card}>
          <Typography style={styles.cardTitle}>Visibility</Typography>
          <View style={styles.statusRow}>
            {['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK'].map((status) => (
              <TouchableOpacity 
                key={status}
                style={[styles.statusOption, form.status === status && styles.statusOptionActive]}
                onPress={() => setForm({...form, status})}
              >
                <Typography style={[styles.statusOptionText, form.status === status && styles.statusOptionTextActive]}>
                  {status.replace(/_/g, ' ')}
                </Typography>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF8F5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingBottom: 16 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#ECE7E1', alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: 'CormorantGaramond_700Bold', fontSize: 24, color: '#1A1918' },
  subtitle: { fontFamily: 'Inter_500Medium', fontSize: 13, color: '#8E8A85' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1918', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, gap: 8 },
  saveBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#FFFFFF' },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40, gap: 20 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#ECE7E1' },
  cardTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#1A1918', marginBottom: 20 },
  row: { flexDirection: 'row', gap: 20 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 10.5, color: '#8E8A85', letterSpacing: 1.2, marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAF8F5', borderRadius: 12, borderWidth: 1, borderColor: '#ECE7E1', paddingHorizontal: 14, height: 48 },
  input: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 14, color: '#1A1918' },
  imageUploadBox: { height: 160, borderRadius: 12, backgroundColor: '#F8F6F3', borderWidth: 1, borderColor: '#ECE7E1', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  errorBox: { backgroundColor: '#FDECEC', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#F8B4B4' },
  errorText: { color: '#D9383A', fontFamily: 'Inter_500Medium', fontSize: 14 },
  statusRow: { flexDirection: 'row', gap: 12 },
  statusOption: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#ECE7E1', backgroundColor: '#FFFFFF' },
  statusOptionActive: { backgroundColor: '#1A1918', borderColor: '#1A1918' },
  statusOptionText: { fontFamily: 'Inter_500Medium', fontSize: 13, color: '#8E8A85' },
  statusOptionTextActive: { color: '#FFFFFF' },
});
