import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Typography } from '../../src/components/ui/Typography';
import { Package, ShoppingBag, CreditCard, Clock, ChevronRight } from 'lucide-react-native';
import { apiClient } from '../../src/api/client';
import { useRouter } from 'expo-router';

export default function VendorDashboardScreen() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await apiClient.get('/vendor/dashboard');
        setData(response.data);
      } catch (err: any) {
        if (err.response?.status === 404 && (err.response?.data?.detail?.includes('Vendor account not found') || err.response?.data?.message?.includes('Vendor account not found'))) {
          router.replace('/vendor/apply');
          return;
        }
        setError(err.response?.data?.detail || err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#CB6D73" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Typography style={{ color: '#D9383A' }}>{error}</Typography>
      </View>
    );
  }

  const statCards = [
    { title: 'Total Revenue', value: `$${data?.revenue?.toLocaleString() || '0'}`, icon: CreditCard, color: '#CB6D73' },
    { title: 'Pending Payout', value: `$${data?.pending_payout?.toLocaleString() || '0'}`, icon: Clock, color: '#D9985F' },
    { title: 'Active Products', value: data?.active_products?.toString() || '0', icon: Package, color: '#6A8A7A' },
    { title: 'Pending Orders', value: data?.pending_orders?.toString() || '0', icon: ShoppingBag, color: '#5B799E' },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Typography style={styles.title}>Vendor Dashboard</Typography>
        <Typography style={styles.subtitle}>Overview of your store&apos;s performance</Typography>
      </View>

      <View style={styles.statsGrid}>
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <View key={idx} style={styles.statCard}>
              <View style={[styles.iconBox, { backgroundColor: stat.color + '15' }]}>
                <Icon size={24} color={stat.color} />
              </View>
              <Typography style={styles.statTitle}>{stat.title}</Typography>
              <Typography style={styles.statValue}>{stat.value}</Typography>
            </View>
          );
        })}
      </View>

      <View style={styles.section}>
        <Typography style={styles.sectionTitle}>Recent Orders</Typography>
        {!data?.recent_orders || data.recent_orders.length === 0 ? (
          <View style={styles.emptyState}>
            <ShoppingBag size={48} color="#ECE7E1" />
            <Typography style={styles.emptyText}>No orders yet</Typography>
            <Typography style={styles.emptySubtext}>Orders containing your products will appear here.</Typography>
          </View>
        ) : (
          <View style={styles.ordersList}>
            {data.recent_orders.map((order: any, idx: number) => (
              <View key={idx} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <Typography style={styles.orderId}>Order #{order.id}</Typography>
                  <View style={[
                    styles.statusBadge,
                    order.status === 'PENDING' ? styles.statusPending : 
                    order.status === 'SHIPPED' ? styles.statusShipped : 
                    order.status === 'DELIVERED' ? styles.statusDelivered :
                    styles.statusDefault
                  ]}>
                    <Typography style={[
                      styles.statusText,
                      order.status === 'PENDING' ? styles.statusTextPending : 
                      order.status === 'SHIPPED' ? styles.statusTextShipped : 
                      order.status === 'DELIVERED' ? styles.statusTextDelivered :
                      styles.statusTextDefault
                    ]}>
                      {order.status}
                    </Typography>
                  </View>
                </View>
                
                <View style={styles.orderDivider} />
                
                <View style={styles.orderBody}>
                  <View style={styles.orderDetail}>
                    <Typography style={styles.orderLabel}>Customer</Typography>
                    <Typography style={styles.orderValue}>{order.customer}</Typography>
                  </View>
                  <View style={styles.orderDetail}>
                    <Typography style={styles.orderLabel}>Amount</Typography>
                    <Typography style={styles.orderAmount}>${order.total}</Typography>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontFamily: 'CormorantGaramond_700Bold',
    fontSize: 28,
    color: '#1A1918',
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#8E8A85',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECE7E1',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statTitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: '#8E8A85',
    marginBottom: 4,
  },
  statValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: '#1A1918',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#1A1918',
    marginBottom: 16,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECE7E1',
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#1A1918',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#8E8A85',
    textAlign: 'center',
  },
  ordersList: {
    gap: 12,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECE7E1',
    padding: 16,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#1A1918',
  },
  orderDivider: {
    height: 1,
    backgroundColor: '#ECE7E1',
    marginBottom: 12,
  },
  orderBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderDetail: {
    gap: 4,
  },
  orderLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: '#8E8A85',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  orderValue: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#1A1918',
  },
  orderAmount: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#CB6D73',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
  },
  statusPending: { backgroundColor: '#FDECEC' },
  statusTextPending: { color: '#D9383A' },
  statusShipped: { backgroundColor: '#EBF3FF' },
  statusTextShipped: { color: '#3A7BD9' },
  statusDelivered: { backgroundColor: '#E9F5EF' },
  statusTextDelivered: { color: '#318C59' },
  statusDefault: { backgroundColor: '#FEF0DB' },
  statusTextDefault: { color: '#D9985F' }
});
