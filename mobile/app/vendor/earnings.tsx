import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import { Typography } from '../../src/components/ui/Typography';
import { useAuthStore } from '../../src/store/useAuthStore';
import { DollarSign, Wallet, ArrowRight, Activity, Percent } from 'lucide-react-native';

export default function VendorEarningsScreen() {
  const { token } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/v1/vendor/earnings', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await response.json();
        setData(json);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchEarnings();
  }, [token]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#CB6D73" />
      </View>
    );
  }

  const { summary, transactions } = data;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Typography style={styles.title}>Earnings & Payouts</Typography>
        <Typography style={styles.subtitle}>Track your sales, commissions, and net earnings.</Typography>
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <View style={styles.metricIconWrap}>
            <DollarSign size={20} color="#1A1918" />
          </View>
          <Typography style={styles.metricLabel}>GROSS SALES</Typography>
          <Typography style={styles.metricValue}>${summary.grossSales.toFixed(2)}</Typography>
        </View>
        <View style={styles.metricCard}>
          <View style={[styles.metricIconWrap, { backgroundColor: '#F0ECE6' }]}>
            <Percent size={20} color="#8E8A85" />
          </View>
          <Typography style={styles.metricLabel}>TRYVIA FEES</Typography>
          <Typography style={[styles.metricValue, { color: '#8E8A85' }]}>-${summary.tryviaFees.toFixed(2)}</Typography>
        </View>
        <View style={[styles.metricCard, { backgroundColor: '#1A1918' }]}>
          <View style={[styles.metricIconWrap, { backgroundColor: '#333333', borderWidth: 0 }]}>
            <Wallet size={20} color="#FFFFFF" />
          </View>
          <Typography style={[styles.metricLabel, { color: '#B0AAA2' }]}>NET EARNINGS</Typography>
          <Typography style={[styles.metricValue, { color: '#FFFFFF' }]}>${summary.netEarnings.toFixed(2)}</Typography>
        </View>
      </View>

      <View style={styles.splitRow}>
        <View style={styles.splitCard}>
          <Activity size={18} color="#D9985F" style={{ marginBottom: 12 }} />
          <Typography style={styles.metricLabel}>PENDING EARNINGS</Typography>
          <Typography style={styles.metricValue}>${summary.pendingEarnings.toFixed(2)}</Typography>
          <Typography style={styles.helpText}>From active orders not yet delivered.</Typography>
        </View>
        <View style={styles.splitCard}>
          <Wallet size={18} color="#318C59" style={{ marginBottom: 12 }} />
          <Typography style={styles.metricLabel}>COMPLETED EARNINGS</Typography>
          <Typography style={styles.metricValue}>${summary.completedEarnings.toFixed(2)}</Typography>
          <Typography style={styles.helpText}>Cleared for future payout processing.</Typography>
        </View>
      </View>

      <View style={styles.listCard}>
        <Typography style={styles.listTitle}>Recent Transactions</Typography>
        
        <View style={styles.tableHeader}>
          <Text style={[styles.th, { flex: 2 }]}>DATE & ORDER</Text>
          <Text style={[styles.th, { flex: 3 }]}>PRODUCT</Text>
          <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>GROSS</Text>
          <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>FEE</Text>
          <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>NET</Text>
          <Text style={[styles.th, { flex: 1, textAlign: 'center' }]}>STATUS</Text>
        </View>

        {transactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Typography style={styles.emptyText}>No transactions yet.</Typography>
          </View>
        ) : (
          transactions.map((tx: any, idx: number) => (
            <View key={idx} style={styles.tr}>
              <View style={{ flex: 2 }}>
                <Typography style={styles.tdDate}>{new Date(tx.date).toLocaleDateString()}</Typography>
                <Typography style={styles.tdId}>#{tx.orderId}</Typography>
              </View>
              <View style={{ flex: 3, justifyContent: 'center' }}>
                <Typography style={styles.tdName} numberOfLines={1}>{tx.productName}</Typography>
                <Typography style={styles.tdType}>{tx.type.toUpperCase()}</Typography>
              </View>
              <Typography style={[styles.tdValue, { flex: 1, textAlign: 'right' }]}>${tx.grossAmount.toFixed(2)}</Typography>
              <Typography style={[styles.tdValue, { flex: 1, textAlign: 'right', color: '#D9383A' }]}>-${tx.tryviaFee.toFixed(2)}</Typography>
              <Typography style={[styles.tdValue, { flex: 1, textAlign: 'right', fontFamily: 'Inter_700Bold' }]}>${tx.netAmount.toFixed(2)}</Typography>
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <View style={[
                  styles.statusBadge,
                  tx.status === 'DELIVERED' ? styles.statusDelivered :
                  tx.status === 'CANCELLED' ? styles.statusCancelled :
                  styles.statusPending
                ]}>
                  <Typography style={[
                    styles.statusText,
                    tx.status === 'DELIVERED' ? styles.statusTextDelivered :
                    tx.status === 'CANCELLED' ? styles.statusTextCancelled :
                    styles.statusTextPending
                  ]}>
                    {tx.status}
                  </Typography>
                </View>
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
  header: { padding: 24, paddingBottom: 16 },
  title: { fontFamily: 'CormorantGaramond_700Bold', fontSize: 28, color: '#1A1918', marginBottom: 4 },
  subtitle: { fontFamily: 'Inter_500Medium', fontSize: 14, color: '#8E8A85' },
  metricsGrid: { flexDirection: 'row', paddingHorizontal: 24, gap: 16, marginBottom: 16 },
  metricCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#ECE7E1' },
  metricIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FAF8F5', borderWidth: 1, borderColor: '#ECE7E1', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  metricLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 10.5, color: '#8E8A85', letterSpacing: 1.2, marginBottom: 8 },
  metricValue: { fontFamily: 'CormorantGaramond_700Bold', fontSize: 32, color: '#1A1918' },
  splitRow: { flexDirection: 'row', paddingHorizontal: 24, gap: 16, marginBottom: 24 },
  splitCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#ECE7E1' },
  helpText: { fontFamily: 'Inter_500Medium', fontSize: 12, color: '#B0AAA2', marginTop: 8 },
  listCard: { backgroundColor: '#FFFFFF', marginHorizontal: 24, borderRadius: 16, borderWidth: 1, borderColor: '#ECE7E1', padding: 24, marginBottom: 40 },
  listTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#1A1918', marginBottom: 20 },
  tableHeader: { flexDirection: 'row', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#ECE7E1' },
  th: { fontFamily: 'Inter_600SemiBold', fontSize: 10, color: '#8E8A85', letterSpacing: 1 },
  tr: { flexDirection: 'row', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F8F6F3' },
  tdDate: { fontFamily: 'Inter_500Medium', fontSize: 12, color: '#8E8A85', marginBottom: 4 },
  tdId: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#1A1918' },
  tdName: { fontFamily: 'Inter_500Medium', fontSize: 13, color: '#1A1918', marginBottom: 4 },
  tdType: { fontFamily: 'Inter_600SemiBold', fontSize: 10, color: '#8E8A85', letterSpacing: 0.5 },
  tdValue: { fontFamily: 'Inter_500Medium', fontSize: 14, color: '#1A1918', paddingTop: 8 },
  emptyState: { padding: 40, alignItems: 'center' },
  emptyText: { fontFamily: 'Inter_500Medium', fontSize: 14, color: '#8E8A85' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginTop: 8 },
  statusText: { fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  statusPending: { backgroundColor: '#FEF0DB' },
  statusTextPending: { color: '#D9985F' },
  statusDelivered: { backgroundColor: '#E9F5EF' },
  statusTextDelivered: { color: '#318C59' },
  statusCancelled: { backgroundColor: '#F0ECE6' },
  statusTextCancelled: { color: '#8E8A85' },
});
