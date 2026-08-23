import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Text, TextInput, Alert } from 'react-native';
import { Typography } from '../../src/components/ui/Typography';
import { useAuthStore } from '../../src/store/useAuthStore';
import { Wallet, Activity, ArrowRight, DollarSign, Clock, CheckCircle, XCircle } from 'lucide-react-native';

export default function VendorPayoutsScreen() {
  const { token } = useAuthStore();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [amountInput, setAmountInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchPayouts = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/payouts/vendor', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await response.json();
      setData(json);
      setAmountInput(json.balances?.availableBalance > 0 ? String(json.balances.availableBalance) : '');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, [token]);

  const handleRequestPayout = async () => {
    const amt = parseFloat(amountInput);
    if (isNaN(amt) || amt < 50) {
      setError('Minimum payout amount is $50.');
      return;
    }

    setRequesting(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/api/v1/payouts/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: amt })
      });
      
      const resData = await response.json();
      if (!response.ok) throw new Error(resData.detail || 'Failed to request payout');
      
      await fetchPayouts();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#CB6D73" />
      </View>
    );
  }

  const { balances, payouts, ledger } = data;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Typography style={styles.title}>Payouts & Ledger</Typography>
        <Typography style={styles.subtitle}>Manage your earnings and withdrawal requests.</Typography>
      </View>

      <View style={styles.metricsGrid}>
        <View style={[styles.metricCard, { backgroundColor: '#1A1918' }]}>
          <View style={[styles.metricIconWrap, { backgroundColor: '#333333', borderWidth: 0 }]}>
            <DollarSign size={20} color="#FFFFFF" />
          </View>
          <Typography style={[styles.metricLabel, { color: '#B0AAA2' }]}>AVAILABLE BALANCE</Typography>
          <Typography style={[styles.metricValue, { color: '#FFFFFF' }]}>${balances.availableBalance.toFixed(2)}</Typography>
        </View>
        <View style={styles.metricCard}>
          <View style={styles.metricIconWrap}>
            <Activity size={20} color="#1A1918" />
          </View>
          <Typography style={styles.metricLabel}>PENDING SETTLEMENT</Typography>
          <Typography style={styles.metricValue}>${balances.pendingBalance.toFixed(2)}</Typography>
        </View>
        <View style={styles.metricCard}>
          <View style={[styles.metricIconWrap, { backgroundColor: '#F0ECE6' }]}>
            <Wallet size={20} color="#8E8A85" />
          </View>
          <Typography style={styles.metricLabel}>TOTAL EARNINGS</Typography>
          <Typography style={[styles.metricValue, { color: '#8E8A85' }]}>${balances.totalEarnings.toFixed(2)}</Typography>
        </View>
      </View>

      <View style={styles.requestCard}>
        <Typography style={styles.cardTitle}>Request Payout</Typography>
        <Typography style={styles.cardDesc}>
          Withdraw your available balance to your bank account. Minimum $50.
        </Typography>
        
        {error && (
          <View style={styles.errorBox}>
            <Typography style={styles.errorText}>{error}</Typography>
          </View>
        )}

        <View style={styles.requestRow}>
          <View style={styles.inputWrapper}>
            <Typography style={styles.inputPrefix}>$</Typography>
            <TextInput
              style={styles.input}
              value={amountInput}
              onChangeText={setAmountInput}
              keyboardType="decimal-pad"
              placeholder="0.00"
            />
          </View>
          <TouchableOpacity 
            style={[styles.requestBtn, (!balances.availableBalance || balances.availableBalance < 50) && { opacity: 0.5 }]} 
            onPress={handleRequestPayout}
            disabled={requesting || !balances.availableBalance || balances.availableBalance < 50}
          >
            {requesting ? <ActivityIndicator size="small" color="#FFFFFF" /> : (
              <Typography style={styles.requestBtnText}>Request Funds</Typography>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.listCard}>
        <Typography style={styles.listTitle}>Payout History</Typography>
        
        <View style={styles.tableHeader}>
          <Text style={[styles.th, { flex: 2 }]}>DATE</Text>
          <Text style={[styles.th, { flex: 2 }]}>AMOUNT</Text>
          <Text style={[styles.th, { flex: 1, textAlign: 'center' }]}>STATUS</Text>
        </View>

        {payouts.length === 0 ? (
          <View style={styles.emptyState}>
            <Typography style={styles.emptyText}>No payouts requested yet.</Typography>
          </View>
        ) : (
          payouts.map((p: any, idx: number) => (
            <View key={idx} style={styles.tr}>
              <View style={{ flex: 2, justifyContent: 'center' }}>
                <Typography style={styles.tdDate}>{new Date(p.createdAt).toLocaleDateString()}</Typography>
                {p.paymentReference && <Typography style={styles.tdRef}>Ref: {p.paymentReference}</Typography>}
              </View>
              <View style={{ flex: 2, justifyContent: 'center' }}>
                <Typography style={styles.tdValue}>${p.amount.toFixed(2)}</Typography>
              </View>
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <View style={[
                  styles.statusBadge,
                  p.status === 'COMPLETED' ? styles.statusCompleted :
                  (p.status === 'FAILED' || p.status === 'REJECTED' || p.status === 'CANCELLED') ? styles.statusFailed :
                  styles.statusPending
                ]}>
                  <Typography style={[
                    styles.statusText,
                    p.status === 'COMPLETED' ? styles.statusTextCompleted :
                    (p.status === 'FAILED' || p.status === 'REJECTED' || p.status === 'CANCELLED') ? styles.statusTextFailed :
                    styles.statusTextPending
                  ]}>
                    {p.status}
                  </Typography>
                </View>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={[styles.listCard, { marginBottom: 60 }]}>
        <Typography style={styles.listTitle}>Financial Ledger</Typography>
        <Typography style={styles.cardDesc}>Immutable record of all financial transactions.</Typography>
        
        <View style={[styles.tableHeader, { marginTop: 12 }]}>
          <Text style={[styles.th, { flex: 2 }]}>DATE</Text>
          <Text style={[styles.th, { flex: 2 }]}>TYPE & REF</Text>
          <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>AMOUNT</Text>
        </View>

        {ledger.length === 0 ? (
          <View style={styles.emptyState}>
            <Typography style={styles.emptyText}>No ledger entries yet.</Typography>
          </View>
        ) : (
          ledger.map((l: any, idx: number) => (
            <View key={idx} style={styles.tr}>
              <View style={{ flex: 2, justifyContent: 'center' }}>
                <Typography style={styles.tdDate}>{new Date(l.createdAt).toLocaleDateString()}</Typography>
                <View style={[
                  styles.statusBadge,
                  l.status === 'AVAILABLE' || l.status === 'COMPLETED' ? styles.statusCompleted :
                  l.status === 'CANCELLED' ? styles.statusFailed :
                  styles.statusPending
                ]}>
                  <Typography style={[
                    styles.statusText,
                    l.status === 'AVAILABLE' || l.status === 'COMPLETED' ? styles.statusTextCompleted :
                    l.status === 'CANCELLED' ? styles.statusTextFailed :
                    styles.statusTextPending
                  ]}>{l.status}</Typography>
                </View>
              </View>
              <View style={{ flex: 2, justifyContent: 'center' }}>
                <Typography style={styles.tdName}>{l.type}</Typography>
                <Typography style={styles.tdSub} numberOfLines={1}>{l.notes || l.reference}</Typography>
              </View>
              <View style={{ flex: 1, alignItems: 'flex-end', justifyContent: 'center' }}>
                <Typography style={[styles.tdValue, l.amount < 0 && { color: '#D9383A' }, l.amount > 0 && { color: '#318C59' }]}>
                  {l.amount > 0 ? '+' : ''}{l.amount.toFixed(2)}
                </Typography>
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
  metricsGrid: { flexDirection: 'row', paddingHorizontal: 24, gap: 16, marginBottom: 24 },
  metricCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#ECE7E1' },
  metricIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FAF8F5', borderWidth: 1, borderColor: '#ECE7E1', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  metricLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 10.5, color: '#8E8A85', letterSpacing: 1.2, marginBottom: 8 },
  metricValue: { fontFamily: 'CormorantGaramond_700Bold', fontSize: 24, color: '#1A1918' },
  requestCard: { backgroundColor: '#FFFFFF', marginHorizontal: 24, borderRadius: 16, borderWidth: 1, borderColor: '#ECE7E1', padding: 24, marginBottom: 24 },
  cardTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#1A1918', marginBottom: 4 },
  cardDesc: { fontFamily: 'Inter_500Medium', fontSize: 13, color: '#8E8A85', marginBottom: 16 },
  requestRow: { flexDirection: 'row', gap: 12 },
  inputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAF8F5', borderRadius: 8, borderWidth: 1, borderColor: '#ECE7E1', paddingHorizontal: 12, height: 48 },
  inputPrefix: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#8E8A85', marginRight: 4 },
  input: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#1A1918' },
  requestBtn: { backgroundColor: '#1A1918', paddingHorizontal: 20, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  requestBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#FFFFFF' },
  errorBox: { backgroundColor: '#FDECEC', padding: 12, borderRadius: 8, marginBottom: 16 },
  errorText: { color: '#D9383A', fontFamily: 'Inter_500Medium', fontSize: 13 },
  listCard: { backgroundColor: '#FFFFFF', marginHorizontal: 24, borderRadius: 16, borderWidth: 1, borderColor: '#ECE7E1', padding: 24, marginBottom: 24 },
  listTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#1A1918', marginBottom: 4 },
  tableHeader: { flexDirection: 'row', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#ECE7E1' },
  th: { fontFamily: 'Inter_600SemiBold', fontSize: 10, color: '#8E8A85', letterSpacing: 1 },
  tr: { flexDirection: 'row', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F8F6F3' },
  tdDate: { fontFamily: 'Inter_500Medium', fontSize: 13, color: '#1A1918', marginBottom: 4 },
  tdRef: { fontFamily: 'Inter_500Medium', fontSize: 11, color: '#8E8A85' },
  tdName: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#1A1918', marginBottom: 4 },
  tdSub: { fontFamily: 'Inter_500Medium', fontSize: 11, color: '#8E8A85' },
  tdValue: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#1A1918' },
  emptyState: { padding: 40, alignItems: 'center' },
  emptyText: { fontFamily: 'Inter_500Medium', fontSize: 14, color: '#8E8A85' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  statusText: { fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  statusPending: { backgroundColor: '#FEF0DB' },
  statusTextPending: { color: '#D9985F' },
  statusCompleted: { backgroundColor: '#E9F5EF' },
  statusTextCompleted: { color: '#318C59' },
  statusFailed: { backgroundColor: '#FDECEC' },
  statusTextFailed: { color: '#D9383A' },
});
