import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Text } from 'react-native';
import { Typography } from '../../../src/components/ui/Typography';
import { useAuthStore } from '../../../src/store/useAuthStore';
import { CheckCircle, XCircle } from 'lucide-react-native';

export default function AdminReturnsScreen() {
  const { token } = useAuthStore();
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);

  const fetchReturns = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/returns/admin', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await response.json();
      setReturns(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, [token]);

  const handleStatusChange = async (id: string, status: string) => {
    setActioning(id);
    try {
      const response = await fetch(`http://localhost:8000/api/v1/returns/admin/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Failed to update return');
      await fetchReturns();
    } catch (e) {
      console.error(e);
    } finally {
      setActioning(null);
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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Typography style={styles.title}>Returns Management</Typography>
        <Typography style={styles.subtitle}>Oversee platform returns and vendor approvals.</Typography>
      </View>

      <View style={styles.tableCard}>
        <View style={styles.tableHeader}>
          <Text style={[styles.th, { flex: 1.5 }]}>VENDOR</Text>
          <Text style={[styles.th, { flex: 2 }]}>PRODUCT</Text>
          <Text style={[styles.th, { flex: 1.5 }]}>CUSTOMER REASON</Text>
          <Text style={[styles.th, { flex: 1 }]}>STATUS</Text>
          <Text style={[styles.th, { flex: 1.5, textAlign: 'right' }]}>ACTIONS</Text>
        </View>

        {returns.length === 0 ? (
          <View style={styles.emptyState}>
            <Typography style={styles.emptyText}>No returns found.</Typography>
          </View>
        ) : (
          returns.map((r, idx) => (
            <View key={idx} style={styles.tr}>
              <View style={{ flex: 1.5, paddingRight: 8 }}>
                <Typography style={styles.tdTitle}>{r.vendor?.storeName}</Typography>
                <Typography style={styles.tdSub}>Order #{r.order?.numericId}</Typography>
              </View>
              
              <View style={{ flex: 2, paddingRight: 8 }}>
                <Typography style={styles.tdTitle} numberOfLines={1}>{r.product?.name}</Typography>
                <Typography style={styles.tdSub}>{r.quantity}x {r.itemType}</Typography>
              </View>

              <View style={{ flex: 1.5, paddingRight: 8 }}>
                <Typography style={styles.tdReason} numberOfLines={2}>{r.customerReason}</Typography>
              </View>

              <View style={{ flex: 1 }}>
                <View style={[
                  styles.statusBadge,
                  r.status === 'REFUNDED' ? styles.statusCompleted :
                  (r.status === 'REJECTED' || r.status === 'CANCELLED') ? styles.statusFailed :
                  r.status === 'APPROVED' ? styles.statusProcessing :
                  styles.statusPending
                ]}>
                  <Typography style={[
                    styles.statusText,
                    r.status === 'REFUNDED' ? styles.statusTextCompleted :
                    (r.status === 'REJECTED' || r.status === 'CANCELLED') ? styles.statusTextFailed :
                    r.status === 'APPROVED' ? styles.statusTextProcessing :
                    styles.statusTextPending
                  ]}>{r.status}</Typography>
                </View>
              </View>

              <View style={{ flex: 1.5, alignItems: 'flex-end' }}>
                {r.status === 'APPROVED' && (
                  <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: '#1A1918' }]}
                    onPress={() => handleStatusChange(r._id, 'PICKUP_PENDING')}
                    disabled={actioning === r._id}
                  >
                    <Typography style={styles.actionBtnText}>Schedule Pickup</Typography>
                  </TouchableOpacity>
                )}
                {r.status === 'PICKUP_PENDING' && (
                  <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: '#3B82F6' }]}
                    onPress={() => handleStatusChange(r._id, 'RECEIVED')}
                    disabled={actioning === r._id}
                  >
                    <Typography style={styles.actionBtnText}>Mark Received</Typography>
                  </TouchableOpacity>
                )}
                {r.status === 'RECEIVED' && (
                  <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: '#318C59' }]}
                    onPress={() => handleStatusChange(r._id, 'REFUNDED')}
                    disabled={actioning === r._id}
                  >
                    <Typography style={styles.actionBtnText}>Refund Customer</Typography>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF8F5' },
  header: { padding: 32, paddingBottom: 24 },
  title: { fontFamily: 'CormorantGaramond_700Bold', fontSize: 32, color: '#1A1918', marginBottom: 8 },
  subtitle: { fontFamily: 'Inter_500Medium', fontSize: 16, color: '#8E8A85' },
  tableCard: { backgroundColor: '#FFFFFF', marginHorizontal: 32, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#ECE7E1', marginBottom: 40 },
  tableHeader: { flexDirection: 'row', paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#ECE7E1', marginBottom: 16 },
  th: { fontFamily: 'Inter_600SemiBold', fontSize: 11, color: '#8E8A85', letterSpacing: 1 },
  tr: { flexDirection: 'row', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F8F6F3', alignItems: 'center' },
  tdTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#1A1918', marginBottom: 4 },
  tdSub: { fontFamily: 'Inter_500Medium', fontSize: 12, color: '#8E8A85' },
  tdReason: { fontFamily: 'Inter_400Regular', fontSize: 13, color: '#4A4846', fontStyle: 'italic' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  statusText: { fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  statusPending: { backgroundColor: '#FEF0DB' },
  statusTextPending: { color: '#D9985F' },
  statusProcessing: { backgroundColor: '#E0F0FF' },
  statusTextProcessing: { color: '#3B82F6' },
  statusCompleted: { backgroundColor: '#E9F5EF' },
  statusTextCompleted: { color: '#318C59' },
  statusFailed: { backgroundColor: '#FDECEC' },
  statusTextFailed: { color: '#D9383A' },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  actionBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#FFFFFF' },
  emptyState: { padding: 60, alignItems: 'center' },
  emptyText: { fontFamily: 'Inter_500Medium', fontSize: 14, color: '#8E8A85' },
});
