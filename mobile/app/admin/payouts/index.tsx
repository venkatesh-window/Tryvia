import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Text } from 'react-native';
import { Typography } from '../../../src/components/ui/Typography';
import { useAuthStore } from '../../../src/store/useAuthStore';
import { CheckCircle, XCircle, Clock } from 'lucide-react-native';

export default function AdminPayoutsScreen() {
  const { token } = useAuthStore();
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);

  const fetchPayouts = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/payouts/admin', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await response.json();
      setPayouts(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, [token]);

  const handleStatusChange = async (id: string, status: string, note: string = '') => {
    setActioning(id);
    try {
      const response = await fetch(`http://localhost:8000/api/v1/payouts/admin/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status, note })
      });
      if (!response.ok) throw new Error('Failed to update payout');
      await fetchPayouts();
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
        <Typography style={styles.title}>Vendor Payouts</Typography>
        <Typography style={styles.subtitle}>Review and process vendor withdrawal requests.</Typography>
      </View>

      <View style={styles.tableCard}>
        <View style={styles.tableHeader}>
          <Text style={[styles.th, { flex: 2 }]}>VENDOR</Text>
          <Text style={[styles.th, { flex: 1 }]}>AMOUNT</Text>
          <Text style={[styles.th, { flex: 2 }]}>BANK DETAILS</Text>
          <Text style={[styles.th, { flex: 1 }]}>STATUS</Text>
          <Text style={[styles.th, { flex: 1.5, textAlign: 'right' }]}>ACTIONS</Text>
        </View>

        {payouts.length === 0 ? (
          <View style={styles.emptyState}>
            <Typography style={styles.emptyText}>No payouts found.</Typography>
          </View>
        ) : (
          payouts.map((p, idx) => (
            <View key={idx} style={styles.tr}>
              <View style={{ flex: 2, paddingRight: 8 }}>
                <Typography style={styles.tdTitle}>{p.vendor?.storeName || 'Unknown Vendor'}</Typography>
                <Typography style={styles.tdSub}>{new Date(p.createdAt).toLocaleDateString()}</Typography>
              </View>
              
              <View style={{ flex: 1 }}>
                <Typography style={styles.tdAmount}>${p.amount.toFixed(2)}</Typography>
              </View>

              <View style={{ flex: 2, paddingRight: 8 }}>
                <Typography style={styles.tdBankName}>{p.bankDetailsSnapshot?.bankName}</Typography>
                <Typography style={styles.tdBankAcc}>Acc: {p.bankDetailsSnapshot?.accountNumber}</Typography>
                <Typography style={styles.tdBankAcc}>IFSC: {p.bankDetailsSnapshot?.ifsc}</Typography>
              </View>

              <View style={{ flex: 1 }}>
                <View style={[
                  styles.statusBadge,
                  p.status === 'COMPLETED' ? styles.statusCompleted :
                  (p.status === 'FAILED' || p.status === 'REJECTED') ? styles.statusFailed :
                  p.status === 'PROCESSING' ? styles.statusProcessing :
                  styles.statusPending
                ]}>
                  <Typography style={[
                    styles.statusText,
                    p.status === 'COMPLETED' ? styles.statusTextCompleted :
                    (p.status === 'FAILED' || p.status === 'REJECTED') ? styles.statusTextFailed :
                    p.status === 'PROCESSING' ? styles.statusTextProcessing :
                    styles.statusTextPending
                  ]}>{p.status}</Typography>
                </View>
              </View>

              <View style={{ flex: 1.5, alignItems: 'flex-end' }}>
                {p.status === 'REQUESTED' && (
                  <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: '#1A1918' }]}
                    onPress={() => handleStatusChange(p._id, 'PROCESSING')}
                    disabled={actioning === p._id}
                  >
                    <Typography style={styles.actionBtnText}>Process</Typography>
                  </TouchableOpacity>
                )}
                {p.status === 'PROCESSING' && (
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity 
                      style={[styles.actionBtn, { backgroundColor: '#318C59' }]}
                      onPress={() => handleStatusChange(p._id, 'COMPLETED', 'Processed successfully')}
                      disabled={actioning === p._id}
                    >
                      <Typography style={styles.actionBtnText}>Mark Done</Typography>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionBtn, { backgroundColor: '#D9383A' }]}
                      onPress={() => handleStatusChange(p._id, 'FAILED', 'Bank rejected')}
                      disabled={actioning === p._id}
                    >
                      <Typography style={styles.actionBtnText}>Fail</Typography>
                    </TouchableOpacity>
                  </View>
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
  tdAmount: { fontFamily: 'Inter_700Bold', fontSize: 16, color: '#1A1918' },
  tdBankName: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#4A4846', marginBottom: 2 },
  tdBankAcc: { fontFamily: 'Inter_500Medium', fontSize: 12, color: '#8E8A85' },
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
