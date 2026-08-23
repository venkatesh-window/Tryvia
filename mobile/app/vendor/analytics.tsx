import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Typography } from '../../src/components/ui/Typography';
import { useAuthStore } from '../../src/store/useAuthStore';
import { TrendingUp, PackageSearch, Award, Droplets } from 'lucide-react-native';

export default function VendorAnalyticsScreen() {
  const { token } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/v1/vendor/analytics', {
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
    fetchAnalytics();
  }, [token]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#CB6D73" />
      </View>
    );
  }

  const { testerSales, fullSizeSales, topProducts, lowStockItems } = data;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Typography style={styles.title}>Analytics</Typography>
        <Typography style={styles.subtitle}>Insights into your store&apos;s performance.</Typography>
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <View style={styles.metricIconWrap}>
            <TrendingUp size={20} color="#1A1918" />
          </View>
          <Typography style={styles.metricLabel}>FULL-SIZE SALES</Typography>
          <Typography style={styles.metricValue}>${fullSizeSales.toFixed(2)}</Typography>
        </View>
        <View style={styles.metricCard}>
          <View style={[styles.metricIconWrap, { backgroundColor: '#F0ECE6' }]}>
            <Droplets size={20} color="#8E8A85" />
          </View>
          <Typography style={styles.metricLabel}>TESTER SALES</Typography>
          <Typography style={[styles.metricValue, { color: '#8E8A85' }]}>${testerSales.toFixed(2)}</Typography>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Award size={20} color="#1A1918" />
          <Typography style={styles.cardTitle}>Top Performing Products</Typography>
        </View>
        
        {topProducts.length === 0 ? (
          <Typography style={styles.emptyText}>Not enough data yet.</Typography>
        ) : (
          topProducts.map((p: any, idx: number) => (
            <View key={idx} style={styles.productRow}>
              <View style={styles.rankBadge}>
                <Typography style={styles.rankText}>{idx + 1}</Typography>
              </View>
              <View style={{ flex: 1 }}>
                <Typography style={styles.productName}>{p.name}</Typography>
                <Typography style={styles.productUnits}>{p.units} units sold</Typography>
              </View>
              <Typography style={styles.productRevenue}>${p.revenue.toFixed(2)}</Typography>
            </View>
          ))
        )}
      </View>

      <View style={[styles.card, { marginBottom: 40 }]}>
        <View style={styles.cardHeader}>
          <PackageSearch size={20} color="#D9383A" />
          <Typography style={styles.cardTitle}>Low Stock Alerts</Typography>
        </View>
        
        {lowStockItems.length === 0 ? (
          <Typography style={styles.emptyText}>Inventory is healthy.</Typography>
        ) : (
          lowStockItems.map((p: any, idx: number) => (
            <View key={idx} style={styles.productRow}>
              <View style={{ flex: 1 }}>
                <Typography style={styles.productName}>{p.name}</Typography>
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
                  <Typography style={[styles.productUnits, p.stockFull < 10 && { color: '#D9383A' }]}>
                    Full Size: {p.stockFull}
                  </Typography>
                  <Typography style={[styles.productUnits, p.stockTester < 10 && { color: '#D9383A' }]}>
                    Tester: {p.stockTester}
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
  metricsGrid: { flexDirection: 'row', paddingHorizontal: 24, gap: 16, marginBottom: 24 },
  metricCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#ECE7E1' },
  metricIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FAF8F5', borderWidth: 1, borderColor: '#ECE7E1', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  metricLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 10.5, color: '#8E8A85', letterSpacing: 1.2, marginBottom: 8 },
  metricValue: { fontFamily: 'CormorantGaramond_700Bold', fontSize: 24, color: '#1A1918' },
  card: { backgroundColor: '#FFFFFF', marginHorizontal: 24, borderRadius: 16, borderWidth: 1, borderColor: '#ECE7E1', padding: 24, marginBottom: 24 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  cardTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#1A1918' },
  productRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F8F6F3' },
  rankBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#FAF8F5', borderWidth: 1, borderColor: '#ECE7E1', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  rankText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#1A1918' },
  productName: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#1A1918' },
  productUnits: { fontFamily: 'Inter_500Medium', fontSize: 12, color: '#8E8A85', marginTop: 2 },
  productRevenue: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#1A1918' },
  emptyText: { fontFamily: 'Inter_500Medium', fontSize: 14, color: '#8E8A85', fontStyle: 'italic' },
});
