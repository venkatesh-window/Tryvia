import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { Typography } from '../../src/components/ui/Typography';
import { ProductCard } from '../../src/components/ui/ProductCard';
import { productService } from '../../src/api/services/productService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCartStore } from '../../src/store/useCartStore';
import { useAuthStore } from '../../src/store/useAuthStore';
import { theme } from '../../src/theme/theme';
import { BlurView } from 'expo-blur';
import { CreditCard, ShoppingBag, Sparkles } from 'lucide-react-native';
import { Image } from 'expo-image';
import Animated, { FadeIn, FadeInUp, Keyframe, Easing } from 'react-native-reanimated';

const customEntering = new Keyframe({
  0: { opacity: 0, transform: [{ translateY: 18 }] },
  100: { opacity: 1, transform: [{ translateY: 0 }], easing: Easing.inOut(Easing.cubic) }
}).duration(700);

const { width } = Dimensions.get('window');

const BANNERS = [
  { id: '1', title: 'The Summer Glow', subtitle: 'DIOR BEAUTY', img: 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?q=80&w=1200&auto=format&fit=crop' },
  { id: '2', title: 'Rhode Skin', subtitle: 'PEPTIDE LIP', img: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=1200&auto=format&fit=crop' },
];

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { totalItems } = useCartStore();
  const { user } = useAuthStore();
  const walletBalance = user?.walletBalance || 0;

  const { data: trendingProducts } = useQuery({
    queryKey: ['trendingProducts'],
    queryFn: () => productService.getProducts(6),
  });

  return (
    <Animated.View entering={customEntering} style={{ flex: 1 }}>
      <ScreenContainer showOrbs={true}>

        {/* Floating Glass Header */}
        <Animated.View entering={FadeIn.duration(1000)} style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 16) }]}>
          <View style={styles.headerTopRow}>
            <Typography style={styles.logo}>tryvia</Typography>

            <View style={styles.headerIcons}>
              <BlurView intensity={30} tint="light" style={styles.walletCapsule}>
                <CreditCard size={14} color={theme.colors.text.primary} />
                <Typography variant="h3" weight="bold" color="primary" style={{ marginLeft: 6, fontSize: 14 }}>
                  ₹{walletBalance}
                </Typography>
              </BlurView>

              <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/cart' as any)}>
                <BlurView intensity={30} tint="light" style={styles.cartBtnBlur}>
                  <ShoppingBag size={20} color={theme.colors.text.primary} strokeWidth={1.5} />
                  {totalItems > 0 && (
                    <View style={styles.badge}>
                      <Typography variant="caption" style={{ color: '#fff', fontSize: 10 }}>{totalItems}</Typography>
                    </View>
                  )}
                </BlurView>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

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
                <View style={styles.bannerCardContainer}>
                  <View style={styles.bannerCard}>
                    <Image source={{ uri: item.img }} style={styles.bannerImg} contentFit="cover" />

                    {/* Glass Text Overlay */}
                    <View style={styles.bannerTextOverlay}>
                      <BlurView intensity={40} tint="light" style={styles.bannerTextBlur}>
                        <Typography variant="caption" style={styles.bannerSubtitle}>{item.subtitle}</Typography>
                        <Typography variant="h2" weight="medium" style={styles.bannerTitle}>{item.title}</Typography>
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
            <TouchableOpacity style={styles.categoryItem} onPress={() => router.push('/(tabs)/products' as any)}>
              <View style={styles.categoryCircle}>
                <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill as any} />
                <Image source={{ uri: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=200&auto=format&fit=crop' }} style={styles.categoryImg} />
                <View style={styles.circleBorder} />
              </View>
              <Typography variant="caption" weight="medium" style={styles.categoryLabel}>FULL SIZE</Typography>
            </TouchableOpacity>

            <TouchableOpacity style={styles.categoryItem} onPress={() => router.push('/(tabs)/testers' as any)}>
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
                <ProductCard
                  key={item.id}
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
              ))}
            </ScrollView>
          </Animated.View>

          <View style={{ height: 180 }} />
        </ScrollView>
      </ScreenContainer>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingBottom: 16,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  logo: {
    fontFamily: 'CormorantGaramond_700Bold',
    fontSize: 36,
    letterSpacing: 3,
    color: theme.colors.text.primary,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  walletCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border.glass,
  },
  iconBtn: {
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
  },
  cartBtnBlur: {
    padding: 10,
    borderWidth: 1,
    borderColor: theme.colors.border.glass,
    borderRadius: 20,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: theme.colors.text.primary,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingTop: 8,
  },
  bannerWrapper: {
    marginBottom: 48,
  },
  bannerCardContainer: {
    width: width,
    paddingHorizontal: 24,
  },
  bannerCard: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: theme.colors.shadow.glass,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 10,
  },
  bannerImg: {
    width: '100%',
    height: '100%',
  },
  bannerTextOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  bannerTextBlur: {
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  bannerSubtitle: {
    letterSpacing: 4,
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: 8,
  },
  bannerTitle: {
    color: '#ffffff',
    letterSpacing: 1,
  },
  glassBorder: {
    ...(StyleSheet.absoluteFill as any),
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
    pointerEvents: 'none',
  },
  categoriesRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 56,
  },
  categoryItem: {
    flex: 1,
    alignItems: 'center',
  },
  categoryCircle: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 32,
    marginBottom: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.2)',
    shadowColor: theme.colors.shadow.glass,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 5,
  },
  categoryImg: {
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  categoryIconCenter: {
    ...(StyleSheet.absoluteFill as any),
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleBorder: {
    ...(StyleSheet.absoluteFill as any),
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: theme.colors.border.glass,
    pointerEvents: 'none',
  },
  categoryLabel: {
    letterSpacing: 2,
    color: theme.colors.text.secondary,
  },
  section: {
    marginBottom: 56,
  },
  sectionTitle: {
    paddingHorizontal: 24,
    marginBottom: 32,
    color: theme.colors.text.primary,
    letterSpacing: 1,
  },
  horizontalList: {
    paddingHorizontal: 24,
    paddingBottom: 24, // Space for shadows
  },
});
