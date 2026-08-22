import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { Typography } from '../../src/components/ui/Typography';
import { useQuery } from '@tanstack/react-query';
import { productService } from '../../src/api/services/productService';
import { ProductCard } from '../../src/components/ui/ProductCard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sparkles, ArrowUpRight } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

export default function OffersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const { data: products } = useQuery({
    queryKey: ['offerProducts'],
    queryFn: () => productService.getProducts(10),
  });

  const cardWidth = (width - 48) / 2;

  return (
    <ScreenContainer>
      <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
        <Typography variant="h2" weight="bold" style={styles.title}>Special Offers & Testers</Typography>
        <Typography variant="body" color="secondary" style={styles.subtitle}>Try samples for ₹200-₹350 and unlock 90% wallet upgrade credits</Typography>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Smart Upgrade Promo Card */}
          <Animated.View entering={FadeInUp.duration(500).delay(100)} style={styles.promoCard}>
            <View style={styles.promoIconRow}>
              <Sparkles size={20} color="#CB6D73" />
              <Typography variant="caption" weight="bold" style={styles.promoTag}>TRYVIA SMART UPGRADE</Typography>
            </View>
            <Typography variant="h3" weight="bold" style={styles.promoHeading}>Try for ₹250 → Get ₹225 Credit</Typography>
            <Typography variant="body" style={styles.promoBody}>
              Order any tester today. 90% of your tester spend is credited directly to your Tryvia Wallet when you upgrade to full size!
            </Typography>
          </Animated.View>

          {/* Grid */}
          <Animated.View entering={FadeInUp.duration(500).delay(200)}>
            <Typography variant="h3" weight="bold" style={styles.sectionHeading}>Trending Tester Offers</Typography>
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
  title: {
    fontSize: 26,
    color: '#1A1918',
    marginBottom: 4,
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
