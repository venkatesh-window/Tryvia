import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Typography } from '../../../src/components/ui/Typography';
import { ArrowLeft, Save, Image as ImageIcon } from 'lucide-react-native';
import { useAuthStore } from '../../../src/store/useAuthStore';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';

export default function AddProductScreen() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '', // Would normally be a dropdown mapping to an ObjectId
    brand: '', // Would normally be a dropdown mapping to an ObjectId
    fullPrice: '',
    testerPrice: '',
    stockFull: '',
    stockTester: '',
    imageUrl: '',
    imageUri: '',
    status: 'ACTIVE'
  });

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      setError("You've refused to allow this app to access your photos!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setForm({ ...form, imageUri: result.assets[0].uri, imageUrl: '' });
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.fullPrice) {
      setError('Name and Full Price are required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // In a real implementation, category and brand would be valid ObjectIds
      // For this test, we might get an error if they are invalid ObjectIds 
      // but we will send them as is or omit them if empty.
      
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('description', form.description);
      formData.append('fullPrice', String(Number(form.fullPrice) || 0));
      formData.append('testerPrice', String(Number(form.testerPrice) || 0));
      formData.append('stockFull', String(Number(form.stockFull) || 0));
      formData.append('stockTester', String(Number(form.stockTester) || 0));
      formData.append('status', form.status);
      
      if (form.imageUrl) {
        formData.append('imageUrl', form.imageUrl);
      }
      
      if (form.imageUri) {
        const localUri = form.imageUri;
        const filename = localUri.split('/').pop() || 'upload.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;
        
        formData.append('image', {
          uri: localUri,
          name: filename,
          type
        } as any);
      }

      if (form.category) formData.append('category', form.category);
      if (form.brand) formData.append('brand', form.brand);

      const response = await fetch('http://localhost:8000/api/v1/vendor/products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Don't set Content-Type to multipart/form-data manually, fetch will set it with the boundary
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to add product');
      }
      
      router.back();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={20} color="#1A1918" />
          </TouchableOpacity>
          <View>
            <Typography style={styles.title}>Add Product</Typography>
            <Typography style={styles.subtitle}>Create a new product listing</Typography>
          </View>
        </View>
        <TouchableOpacity style={styles.saveBtn} activeOpacity={0.8} onPress={handleSave} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Save size={16} color="#FFFFFF" />
              <Typography style={styles.saveBtnText}>Save Product</Typography>
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
              <TextInput 
                style={styles.input} 
                value={form.name} 
                onChangeText={(val) => setForm({...form, name: val})}
                placeholder="e.g. Glowing Face Serum"
              />
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
                placeholder="Describe your product..."
              />
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Typography style={styles.cardTitle}>Media</Typography>
          <TouchableOpacity style={styles.imageUploadBox} onPress={pickImage} activeOpacity={0.8}>
            {form.imageUri ? (
              <Image source={{ uri: form.imageUri }} style={{ width: '100%', height: '100%', borderRadius: 12 }} contentFit="cover" />
            ) : (
              <>
                <ImageIcon size={32} color="#B0AAA2" />
                <Typography style={{ color: '#8E8A85', marginTop: 8, fontFamily: 'Inter_500Medium' }}>Tap to Upload Image</Typography>
              </>
            )}
          </TouchableOpacity>
          <View style={[styles.inputGroup, { marginTop: 16 }]}>
            <Typography style={styles.inputLabel}>IMAGE URL (Fallback)</Typography>
            <View style={styles.inputWrapper}>
              <TextInput 
                style={styles.input} 
                value={form.imageUrl} 
                onChangeText={(val) => setForm({...form, imageUrl: val})}
                placeholder="https://example.com/image.jpg"
              />
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
