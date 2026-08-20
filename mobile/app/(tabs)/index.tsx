import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { Typography } from '../../src/components/ui/Typography';
import { ProductCard } from '../../src/components/ui/ProductCard';
import { productService } from '../../src/api/services/productService';
import { useCartStore } from '../../src/store/useCartStore';
import { useAuthStore } from '../../src/store/useAuthStore';
import { theme } from '../../src/theme/theme';
import { BlurView } from 'expo-blur';
import { CreditCard, ShoppingBag } from 'lucide-react-native';
import { Image } from 'expo-image';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useResponsive } from '../../src/hooks/useResponsive';

const BANNERS = [
  { id: '1', title: 'The Summer Glow', subtitle: 'DIOR BEAUTY', img: 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?q=80&w=1200&auto=format&fit=crop' },
  { id: '2', title: 'Rhode Skin', subtitle: 'PEPTIDE LIP', img: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=1200&auto=format&fit=crop' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { width, safeTopPadding, bottomTabBarPadding, isSmallDevice } = useResponsive();
  const { totalItems } = useCartStore();
  const { user } = useAuthStore();
  const walletBalance = user?.walletBalance || 0;

  const { data: trendingProducts } = useQuery({
    queryKey: ['trendingProducts'],
    queryFn: () => productService.getProducts(6),
  });

  const cardWidth = Math.min(220, Math.max(160, width * 0.52));

  return (
    <Animated.View entering={FadeIn.duration(600)} style={{ flex: 1 }}>
      <ScreenContainer showOrbs={true}>

        {/* Floating Glass Header */}
        <Animated.View entering={FadeIn.duration(1000)} style={[styles.headerContainer, { paddingTop: safeTopPadding }]}>
          <View style={styles.headerTopRow}>
            <Typography style={styles.logo}>tryvia</Typography>

            <View style={styles.headerIcons}>
              <BlurView intensity={30} tint="light" style={styles.walletCapsule}>
                <CreditCard size={13} color={theme.colors.text.primary} />
                <Typography variant="price" weight="bold" color="primary" numberOfLines={1} style={{ marginLeft: 5, fontSize: 13 }}>
                  ₹{walletBalance}
                </Typography>
              </BlurView>

              <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/cart' as any)} activeOpacity={0.8} hitSlop={8}>
                <BlurView intensity={40} tint="light" style={styles.cartBtnBlur}>
                  <ShoppingBag size={19} color={theme.colors.text.primary} strokeWidth={1.5} />
                </BlurView>
                {totalItems > 0 && (
                  <View style={styles.badge}>
                    <Typography variant="caption" weight="bold" style={{ color: '#fff', fontSize: 9 }}>{totalItems}</Typography>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomTabBarPadding }]} showsVerticalScrollIndicator={false}>

          {/* Luxury Hero Banner Carousel */}
          <Animated.View entering={FadeInUp.duration(1000).delay(200)} style={styles.bannerWrapper}>
            <FlatList
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              data={BANNERS}
              keyExtractor={item => item.id}
              snapToInterval={width}
              decelerationRate="fast"
              renderItem={({ item }) => (
                <View style={[styles.bannerCardContainer, { width }]}>
                  <View style={styles.bannerCard}>
                    <Image source={{ uri: item.img }} style={styles.bannerImg} contentFit="cover" />

                    {/* Glass Text Overlay */}
                    <View style={styles.bannerTextOverlay}>
                      <BlurView intensity={50} tint="light" style={styles.bannerTextBlur}>
                        <Typography variant="caption" numberOfLines={1} style={styles.bannerSubtitle}>{item.subtitle}</Typography>
                        <Typography variant="h2" weight="medium" numberOfLines={1} style={styles.bannerTitle}>{item.title}</Typography>
                      </BlurView>
                    </View>

                    <View style={styles.glassBorder} />
                  </View>
                </View>
              )}
            />
          </Animated.View>

          {/* Floating Circular Categories */}
          <Animated.View entering={FadeInUp.duration(1000).delay(400)} style={styles.categoriesRow}>
            <TouchableOpacity style={styles.categoryItem} onPress={() => router.push('/(tabs)/products' as any)} activeOpacity={0.8}>
              <View style={styles.categoryCircle}>
                <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill as any} />
                <Image source={{ uri: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=200&auto=format&fit=crop' }} style={styles.categoryImg} />
                <View style={styles.circleBorder} />
              </View>
              <Typography variant="caption" weight="medium" style={styles.categoryLabel}>FULL SIZE</Typography>
            </TouchableOpacity>

            <TouchableOpacity style={styles.categoryItem} onPress={() => router.push('/(tabs)/testers' as any)} activeOpacity={0.8}>
              <View style={styles.categoryCircle}>
                <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill as any} />
                <Image source={{ uri: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?q=80&w=200&auto=format&fit=crop' }} style={styles.categoryImg} />
                <View style={styles.circleBorder} />
              </View>
              <Typography variant="caption" weight="medium" style={styles.categoryLabel}>TESTERS</Typography>
            </TouchableOpacity>
          </Animated.View>

          {/* Suggested Horizontal Feed */}
          <Animated.View entering={FadeInUp.duration(1000).delay(600)} style={styles.section}>
            <Typography variant="h3" weight="medium" style={styles.sectionTitle}>Curated For You</Typography>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
              {trendingProducts?.slice(0, 4).map((item) => (
                <View key={item.id} style={{ width: cardWidth, marginRight: 14 }}>
                  <ProductCard
                    product={{
                      id: item.id,
                      name: item.name,
                      brand: item.brand?.name || 'CHANEL',
                      fullPrice: item.full_price,
                      testerPrice: item.tester_price,
                      imageUrl: item.image_url || 'https://via.placeholder.com/300'
                    }}
                    onPress={() => router.push(`/product/${item.id}` as any)}
                  />
                </View>
              ))}
            </ScrollView>
          </Animated.View>

        </ScrollView>
      </ScreenContainer>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingBottom: 12,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  logo: {
    fontFamily: 'CormorantGaramond_700Bold',
    fontSize: 32,
    letterSpacing: 2,
    color: theme.colors.text.primary,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  walletCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border.glass,
  },
  iconBtn: {
    position: 'relative',
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBtnBlur: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  badge: {
    position: 'absolute',
    top: -1,
    right: -1,
    backgroundColor: theme.colors.text.primary,
    minWidth: 17,
    height: 17,
    borderRadius: 8.5,
    paddingHorizontal: 3,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    zIndex: 10,
  },
  scrollContent: {
    paddingTop: 8,
  },
  bannerWrapper: {
    marginBottom: 36,
  },
  bannerCardContainer: {
    paddingHorizontal: 20,
  },
  bannerCard: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: theme.colors.shadow.glass,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  bannerImg: {
    width: '100%',
    height: '100%',
  },
  bannerTextOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    borderRadius: 14,
    overflow: 'hidden',
  },
  bannerTextBlur: {
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  bannerSubtitle: {
    letterSpacing: 2,
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: 4,
    fontSize: 10,
  },
  bannerTitle: {
    color: '#ffffff',
    letterSpacing: 0.5,
    fontSize: 20,
  },
  glassBorder: {
    ...(StyleSheet.absoluteFill as any),
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
    pointerEvents: 'none',
  },
  categoriesRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 40,
  },
  categoryItem: {
    flex: 1,
    alignItems: 'center',
  },
  categoryCircle: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 28,
    marginBottom: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.2)',
    shadowColor: theme.colors.shadow.glass,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  categoryImg: {
    width: '100%',
    height: '100%',
    opacity: 0.85,
  },
  circleBorder: {
    ...(StyleSheet.absoluteFill as any),
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: theme.colors.border.glass,
    pointerEvents: 'none',
  },
  categoryLabel: {
    letterSpacing: 1.5,
    color: theme.colors.text.secondary,
    fontSize: 11,
  },
  section: {
    marginBottom: 36,
  },
  sectionTitle: {
    paddingHorizontal: 20,
    marginBottom: 20,
    color: theme.colors.text.primary,
    letterSpacing: 0.5,
    fontSize: 20,
  },
  horizontalList: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
});

