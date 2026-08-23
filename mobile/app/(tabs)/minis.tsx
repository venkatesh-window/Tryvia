import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { Typography } from '../../src/components/ui/Typography';
import { useQuery } from '@tanstack/react-query';
import { productService } from '../../src/api/services/productService';
import { ProductCard } from '../../src/components/ui/ProductCard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCartStore } from '../../src/store/useCartStore';
import { useAuthStore } from '../../src/store/useAuthStore';
import { Sparkles, ArrowUpRight, CreditCard, ShoppingBag } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

export default function OffersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { totalItems } = useCartStore();
  const { user } = useAuthStore();
  const walletBalance = user?.walletBalance || 350;

  const { data: products } = useQuery({
    queryKey: ['offerProducts'],
    queryFn: () => productService.getProducts(10),
  });

  const cardWidth = (width - 48) / 2;

  return (
    <ScreenContainer>
      <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerTopRow}>
          <Typography style={styles.title}>Minis</Typography>
          <View style={styles.headerRightActions}>
            <TouchableOpacity style={styles.walletPill} activeOpacity={0.8} onPress={() => router.push({ pathname: '/(tabs)/profile', params: { openWallet: 'true' } } as any)}>
              <CreditCard size={14} color="#1A1918" strokeWidth={2} />
              <Typography style={styles.walletText}>₹{walletBalance}</Typography>
            </TouchableOpacity>
            <TouchableOpacity style={styles.bagBtn} activeOpacity={0.8} onPress={() => router.push('/cart' as any)}>
              <ShoppingBag size={18} color="#1A1918" strokeWidth={1.75} />
              {totalItems > 0 && (
                <View style={styles.cartBadge}>
                  <Typography style={styles.cartBadgeText}>{totalItems}</Typography>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
        <Typography variant="body" color="secondary" style={styles.subtitle}>Try samples for ₹200-₹350 and unlock 90% wallet upgrade credits</Typography>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Smart Upgrade Promo Card */}
          <Animated.View entering={FadeInUp.duration(500).delay(100)} style={styles.promoCard}>
            <View style={styles.promoIconRow}>
              <Sparkles size={20} color="#CB6D73" />
              <Typography variant="caption" weight="bold" style={styles.promoTag}>TRYVIA SMART UPGRADE</Typography>
            </View>
            <Typography variant="h3" weight="bold" style={styles.promoHeading}>
              Try for <Text style={{ fontFamily: 'Inter_700Bold' }}>₹250</Text> → Get <Text style={{ fontFamily: 'Inter_700Bold' }}>₹225</Text> Credit
            </Typography>
            <Typography style={styles.promoText}>Order any mini today. 90% of your mini spend is credited to your TryVia Wallet to upgrade to full size later!</Typography>
          </Animated.View>

          {/* Grid */}
          <Animated.View entering={FadeInUp.duration(500).delay(200)}>
            <Typography variant="h3" weight="medium" style={styles.sectionTitle}>Trending Minis</Typography>
          </Animated.View>

          <View style={styles.grid}>
            {products?.map((item, idx) => (
              <Animated.View 
                key={item.id} 
                entering={FadeInUp.duration(450).delay(250 + Math.min(idx, 6) * 60)} 
                style={{ width: cardWidth }}
              >
                <ProductCard
                  product={{
                    id: item.id,
                    name: item.name,
                    brand: item.brand?.name || 'DIOR',
                    fullPrice: item.full_price,
                    testerPrice: item.tester_price,
                    imageUrl: item.image_url || 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=600&auto=format&fit=crop',
                    category: item.category?.name || 'Beauty',
                  }}
                  onPress={() => router.push(`/product/${item.id}` as any)}
                />
              </Animated.View>
            ))}
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: '#FAF8F5',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontFamily: 'CormorantGaramond_700Bold',
    fontSize: 30,
    color: '#1A1918',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  walletPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ECE7E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  walletText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1918',
    fontFamily: 'Inter_700Bold',
  },
  bagBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECE7E1',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#CB6D73',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    color: '#8E8A85',
    marginBottom: 16,
    lineHeight: 18,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  promoCard: {
    backgroundColor: '#F7EDE8',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EBDCD4',
    marginBottom: 24,
  },
  promoIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  promoTag: {
    color: '#CB6D73',
    letterSpacing: 1,
    fontSize: 10,
  },
  promoHeading: {
    fontSize: 17,
    color: '#1A1918',
    marginBottom: 6,
  },
  promoBody: {
    fontSize: 13,
    color: '#5A544F',
    lineHeight: 18,
  },
  sectionHeading: {
    fontSize: 18,
    color: '#1A1918',
    marginBottom: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
});
