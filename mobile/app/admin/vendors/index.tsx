import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import { Typography } from '../../../src/components/ui/Typography';
import { useAuthStore } from '../../../src/store/useAuthStore';
import { useRouter } from 'expo-router';
import { Store, User, ChevronRight } from 'lucide-react-native';

export default function AdminVendorsScreen() {
  const { token } = useAuthStore();
  const router = useRouter();
  
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/v1/admin/vendors', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch vendors');
        const data = await response.json();
        setVendors(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchVendors();
  }, [token]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#CB6D73" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Typography style={styles.title}>Vendors</Typography>
        <Typography style={styles.subtitle}>Manage all TRYVIA partner stores.</Typography>
      </View>

      {error && (
        <View style={{ marginHorizontal: 24, marginBottom: 20, padding: 16, backgroundColor: '#FDECEC', borderRadius: 8 }}>
          <Typography style={{ color: '#D9383A' }}>{error}</Typography>
        </View>
      )}

      <View style={styles.listCard}>
        <View style={styles.tableHeader}>
          <Text style={[styles.th, { flex: 2 }]}>STORE</Text>
          <Text style={[styles.th, { flex: 2 }]}>OWNER</Text>
          <Text style={[styles.th, { flex: 1, textAlign: 'center' }]}>STATUS</Text>
          <Text style={[styles.th, { width: 40 }]}></Text>
        </View>

        {vendors.length === 0 ? (
          <View style={styles.emptyState}>
            <Typography style={styles.emptyText}>No vendors found.</Typography>
          </View>
        ) : (
          vendors.map((vendor) => (
            <TouchableOpacity 
              key={vendor._id} 
              style={styles.tr}
              activeOpacity={0.7}
              onPress={() => router.push(`/admin/vendors/${vendor._id}`)}
            >
              <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={styles.iconWrap}>
                  <Store size={16} color="#8E8A85" />
                </View>
                <View>
                  <Typography style={styles.tdName}>{vendor.storeName}</Typography>
                  <Typography style={styles.tdSub}>{new Date(vendor.createdAt).toLocaleDateString()}</Typography>
                </View>
              </View>
              
              <View style={{ flex: 2, justifyContent: 'center' }}>
                <Typography style={styles.tdName}>{vendor.ownerName}</Typography>
                <Typography style={styles.tdSub}>{vendor.email}</Typography>
              </View>
              
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <View style={[
                  styles.statusBadge,
                  vendor.status === 'APPROVED' ? styles.statusApproved :
                  vendor.status === 'REJECTED' ? styles.statusRejected :
                  vendor.status === 'SUSPENDED' ? styles.statusSuspended :
                  styles.statusPending
                ]}>
                  <Typography style={[
                    styles.statusText,
                    vendor.status === 'APPROVED' ? styles.statusTextApproved :
                    vendor.status === 'REJECTED' ? styles.statusTextRejected :
                    vendor.status === 'SUSPENDED' ? styles.statusTextSuspended :
                    styles.statusTextPending
                  ]}>
                    {vendor.status}
                  </Typography>
                </View>
              </View>
              
              <View style={{ width: 40, alignItems: 'flex-end', justifyContent: 'center' }}>
                <ChevronRight size={20} color="#B0AAA2" />
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF8F5' },
  header: { padding: 24, paddingBottom: 24 },
  title: { fontFamily: 'CormorantGaramond_700Bold', fontSize: 28, color: '#1A1918', marginBottom: 4 },
  subtitle: { fontFamily: 'Inter_500Medium', fontSize: 14, color: '#8E8A85' },
  listCard: { backgroundColor: '#FFFFFF', marginHorizontal: 24, borderRadius: 16, borderWidth: 1, borderColor: '#ECE7E1', padding: 24, marginBottom: 40 },
  tableHeader: { flexDirection: 'row', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#ECE7E1' },
  th: { fontFamily: 'Inter_600SemiBold', fontSize: 10, color: '#8E8A85', letterSpacing: 1 },
  tr: { flexDirection: 'row', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F8F6F3' },
  iconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FAF8F5', borderWidth: 1, borderColor: '#ECE7E1', alignItems: 'center', justifyContent: 'center' },
  tdName: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#1A1918', marginBottom: 2 },
  tdSub: { fontFamily: 'Inter_500Medium', fontSize: 12, color: '#8E8A85' },
  emptyState: { padding: 40, alignItems: 'center' },
  emptyText: { fontFamily: 'Inter_500Medium', fontSize: 14, color: '#8E8A85' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  statusPending: { backgroundColor: '#FEF0DB' },
  statusTextPending: { color: '#D9985F' },
  statusApproved: { backgroundColor: '#E9F5EF' },
  statusTextApproved: { color: '#318C59' },
  statusRejected: { backgroundColor: '#FDECEC' },
  statusTextRejected: { color: '#D9383A' },
  statusSuspended: { backgroundColor: '#F0ECE6' },
  statusTextSuspended: { color: '#8E8A85' },
});
