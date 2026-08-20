import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, FileText } from 'lucide-react-native';
import { Typography } from '../../src/components/ui/Typography';
import { useOrderStore } from '../../src/store/useOrderStore';
import { theme } from '../../src/theme/theme';

export default function InvoiceScreen() {
  const { id } = useLocalSearchParams();
  const { orders, fetchOrders } = useOrderStore();
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (orders.length > 0) {
      const found = orders.find(o => o.id === Number(id));
      if (found) setOrder(found);
    }
  }, [orders, id]);

  if (!order) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Typography variant="body">Loading invoice...</Typography>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Typography variant="h3" weight="bold">Invoice #{order.orderNumber}</Typography>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <View style={styles.row}>
            <FileText size={20} color="#D4AF37" />
            <Typography variant="h3" style={{ marginLeft: 8 }}>Order Receipt</Typography>
          </View>
          <View style={styles.divider} />
          
          <View style={styles.infoRow}>
            <Typography variant="caption" color="secondary">Date:</Typography>
            <Typography variant="body" weight="medium">{order.date}</Typography>
          </View>
          <View style={styles.infoRow}>
            <Typography variant="caption" color="secondary">Status:</Typography>
            <Typography variant="body" weight="medium">{order.status}</Typography>
          </View>
          <View style={styles.infoRow}>
            <Typography variant="caption" color="secondary">Payment Method:</Typography>
            <Typography variant="body" weight="medium">{order.paymentMethod}</Typography>
          </View>
          
          <View style={styles.divider} />
          
          <Typography variant="h3" style={{ marginBottom: 12 }}>Items</Typography>
          {order.items.map((item: any, index: number) => (
            <View key={index} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Typography variant="body" weight="medium">{item.name}</Typography>
                <Typography variant="caption" color="secondary">Qty: {item.quantity} • {item.type === 'tester' ? 'Tester' : 'Full Size'}</Typography>
              </View>
              <Typography variant="price">₹{item.price * item.quantity}</Typography>
            </View>
          ))}
          
          <View style={styles.divider} />
          
          <View style={styles.infoRow}>
            <Typography variant="body" color="secondary">Subtotal:</Typography>
            <Typography variant="body" weight="medium">₹{order.items.reduce((acc: any, i: any) => acc + (i.price * i.quantity), 0)}</Typography>
          </View>
          
          {order.walletDeduction > 0 && (
            <View style={styles.infoRow}>
              <Typography variant="body" color="secondary">Wallet Applied:</Typography>
              <Typography variant="body" weight="medium" style={{ color: '#16A34A' }}>-₹{order.walletDeduction}</Typography>
            </View>
          )}

          {order.platformFee > 0 && (
            <View style={styles.infoRow}>
              <Typography variant="body" color="secondary">Platform Fee:</Typography>
              <Typography variant="body" weight="medium">₹{order.platformFee}</Typography>
            </View>
          )}
          <View style={[styles.infoRow, { marginTop: 12 }]}>
            <Typography variant="h3">Total Paid:</Typography>
            <Typography variant="price" weight="bold" style={{ fontSize: 20 }}>₹{order.total}</Typography>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#FAFAF8',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginVertical: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  }
});
