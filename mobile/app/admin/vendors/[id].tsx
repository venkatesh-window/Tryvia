import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { Typography } from '../../../src/components/ui/Typography';
import { useAuthStore } from '../../../src/store/useAuthStore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Store, Package, ShoppingBag, DollarSign, Activity } from 'lucide-react-native';

export default function AdminVendorDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { token } = useAuthStore();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVendor = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/admin/vendors/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch vendor');
      const json = await response.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchVendor();
  }, [id, token]);

  const updateStatus = async (newStatus: string) => {
    setUpdating(true);
    try {
      const response = await fetch(`http://localhost:8000/api/v1/admin/vendors/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) throw new Error('Failed to update status');
      
      await fetchVendor();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#CB6D73" />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Typography style={{ color: '#D9383A' }}>{error || 'Vendor not found'}</Typography>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Typography style={{ color: '#1A1918' }}>Go Back</Typography>
        </TouchableOpacity>
      </View>
    );
  }

  const { vendor, metrics } = data;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={20} color="#1A1918" />
          </TouchableOpacity>
          <View>
            <Typography style={styles.title}>{vendor.storeName}</Typography>
            <Typography style={styles.subtitle}>ID: {vendor.numericId}</Typography>
          </View>
        </View>
        
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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.row}>
          <View style={[styles.column, { flex: 2 }]}>
            
            <View style={styles.card}>
              <Typography style={styles.cardTitle}>Vendor Approval & Status</Typography>
              <Typography style={styles.helperText}>Manage this vendor's ability to sell on TRYVIA.</Typography>
              
              <View style={styles.statusButtonsContainer}>
                <TouchableOpacity 
                  style={[styles.actionBtn, { borderColor: '#A3D9B8' }, vendor.status === 'APPROVED' && { backgroundColor: '#E9F5EF' }]}
                  onPress={() => updateStatus('APPROVED')}
                  disabled={updating || vendor.status === 'APPROVED'}
                >
                  <Typography style={[styles.actionBtnText, { color: '#318C59' }]}>Approve Vendor</Typography>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.actionBtn, { borderColor: '#F8B4B4' }, vendor.status === 'REJECTED' && { backgroundColor: '#FDECEC' }]}
                  onPress={() => updateStatus('REJECTED')}
                  disabled={updating || vendor.status === 'REJECTED'}
                >
                  <Typography style={[styles.actionBtnText, { color: '#D9383A' }]}>Reject Vendor</Typography>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.actionBtn, { borderColor: '#ECE7E1' }, vendor.status === 'SUSPENDED' && { backgroundColor: '#F0ECE6' }]}
                  onPress={() => updateStatus('SUSPENDED')}
                  disabled={updating || vendor.status === 'SUSPENDED'}
                >
                  <Typography style={[styles.actionBtnText, { color: '#8E8A85' }]}>Suspend Account</Typography>
                </TouchableOpacity>
              </View>
              {updating && <ActivityIndicator size="small" color="#CB6D73" style={{ marginTop: 12 }} />}
            </View>

            <View style={styles.card}>
              <Typography style={styles.cardTitle}>Business Metrics</Typography>
              
              <View style={styles.metricsGrid}>
                <View style={styles.metricItem}>
                  <Package size={20} color="#8E8A85" />
                  <Typography style={styles.metricLabel}>PRODUCTS</Typography>
                  <Typography style={styles.metricValue}>{metrics.totalProducts}</Typography>
                </View>
                <View style={styles.metricItem}>
                  <ShoppingBag size={20} color="#8E8A85" />
                  <Typography style={styles.metricLabel}>ORDERS</Typography>
                  <Typography style={styles.metricValue}>{metrics.totalOrders}</Typography>
                </View>
                <View style={styles.metricItem}>
                  <DollarSign size={20} color="#8E8A85" />
                  <Typography style={styles.metricLabel}>SALES</Typography>
                  <Typography style={styles.metricValue}>${metrics.totalSales.toFixed(2)}</Typography>
                </View>
              </View>

              <View style={[styles.metricsGrid, { marginTop: 16 }]}>
                <View style={styles.metricItem}>
                  <Activity size={20} color="#8E8A85" />
                  <Typography style={styles.metricLabel}>PENDING BALANCE</Typography>
                  <Typography style={styles.metricValue}>${metrics.pendingBalance?.toFixed(2) || '0.00'}</Typography>
                </View>
                <View style={styles.metricItem}>
                  <DollarSign size={20} color="#8E8A85" />
                  <Typography style={styles.metricLabel}>TOTAL EARNINGS</Typography>
                  <Typography style={styles.metricValue}>${metrics.vendorEarnings?.toFixed(2) || '0.00'}</Typography>
                </View>
                <View style={[styles.metricItem, { backgroundColor: '#FAF8F5' }]}>
                  <DollarSign size={20} color="#1A1918" />
                  <Typography style={[styles.metricLabel, { color: '#1A1918' }]}>AVAILABLE BALANCE</Typography>
                  <Typography style={styles.metricValue}>${metrics.availableBalance?.toFixed(2) || '0.00'}</Typography>
                </View>
              </View>
            </View>

          </View>
          
          <View style={[styles.column, { flex: 1 }]}>
            <View style={styles.card}>
              <Typography style={styles.cardTitle}>Vendor Info</Typography>
              
              <View style={styles.infoRow}>
                <Typography style={styles.infoLabel}>OWNER</Typography>
                <Typography style={styles.infoValue}>{vendor.user?.fullName || 'N/A'}</Typography>
              </View>
              
              <View style={styles.infoRow}>
                <Typography style={styles.infoLabel}>EMAIL</Typography>
                <Typography style={styles.infoValue}>{vendor.email}</Typography>
              </View>
              
              <View style={styles.infoRow}>
                <Typography style={styles.infoLabel}>PHONE</Typography>
                <Typography style={styles.infoValue}>{vendor.phone || 'N/A'}</Typography>
              </View>
              
              <View style={styles.infoRow}>
                <Typography style={styles.infoLabel}>SLUG</Typography>
                <Typography style={styles.infoValue}>{vendor.slug || 'N/A'}</Typography>
              </View>

              <View style={[styles.infoRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                <Typography style={styles.infoLabel}>MEMBER SINCE</Typography>
                <Typography style={styles.infoValue}>
                  {new Date(vendor.createdAt).toLocaleDateString()}
                </Typography>
              </View>
            </View>

            <View style={styles.card}>
              <Typography style={styles.cardTitle}>Status History</Typography>
              {vendor.statusHistory && vendor.statusHistory.length > 0 ? (
                <View style={styles.historyTimeline}>
                  {vendor.statusHistory.map((event: any, idx: number) => (
                    <View key={idx} style={styles.historyEvent}>
                      <View style={styles.historyDot} />
                      {idx !== vendor.statusHistory.length - 1 && <View style={styles.historyLine} />}
                      <View style={styles.historyContent}>
                        <Typography style={styles.historyStatus}>{event.status}</Typography>
                        <Typography style={styles.historyDate}>
                          {new Date(event.changedAt).toLocaleString()}
                        </Typography>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <Typography style={styles.helperText}>No history available.</Typography>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF8F5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingBottom: 16 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#ECE7E1', alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: 'CormorantGaramond_700Bold', fontSize: 24, color: '#1A1918' },
  subtitle: { fontFamily: 'Inter_500Medium', fontSize: 13, color: '#8E8A85' },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  row: { flexDirection: 'row', gap: 20 },
  column: { gap: 20 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#ECE7E1' },
  cardTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#1A1918', marginBottom: 12 },
  helperText: { fontFamily: 'Inter_500Medium', fontSize: 13, color: '#8E8A85', marginBottom: 16 },
  statusButtonsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1, backgroundColor: '#FFFFFF' },
  actionBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  metricsGrid: { flexDirection: 'row', gap: 16 },
  metricItem: { flex: 1, borderWidth: 1, borderColor: '#ECE7E1', borderRadius: 12, padding: 16, alignItems: 'flex-start' },
  metricLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 10, color: '#8E8A85', letterSpacing: 1, marginTop: 12, marginBottom: 4 },
  metricValue: { fontFamily: 'CormorantGaramond_700Bold', fontSize: 24, color: '#1A1918' },
  infoRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#ECE7E1' },
  infoLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 10, color: '#8E8A85', letterSpacing: 0.5, marginBottom: 6 },
  infoValue: { fontFamily: 'Inter_500Medium', fontSize: 14, color: '#1A1918' },
  historyTimeline: { marginTop: 8 },
  historyEvent: { flexDirection: 'row', marginBottom: 20 },
  historyDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#CB6D73', marginTop: 4 },
  historyLine: { position: 'absolute', left: 4.5, top: 14, width: 1, height: 40, backgroundColor: '#ECE7E1' },
  historyContent: { marginLeft: 16 },
  historyStatus: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#1A1918', marginBottom: 2 },
  historyDate: { fontFamily: 'Inter_500Medium', fontSize: 12, color: '#8E8A85' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  statusPending: { backgroundColor: '#FEF0DB' },
  statusTextPending: { color: '#D9985F' },
  statusApproved: { backgroundColor: '#E9F5EF' },
  statusTextApproved: { color: '#318C59' },
  statusRejected: { backgroundColor: '#FDECEC' },
  statusTextRejected: { color: '#D9383A' },
  statusSuspended: { backgroundColor: '#F0ECE6' },
  statusTextSuspended: { color: '#8E8A85' },
});
