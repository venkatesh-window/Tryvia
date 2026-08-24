import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Platform, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { Typography } from '../../src/components/ui/Typography';
import { productService } from '../../src/api/services/productService';
import { useCartStore } from '../../src/store/useCartStore';
import { useWishlistStore } from '../../src/store/useWishlistStore';
import { Image } from 'expo-image';
import { 
  ChevronLeft, 
  Heart, 
  ShoppingBag, 
  Check, 
  Sparkles, 
  Gift, 
  ShieldCheck,
  Zap,
  Repeat
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { getFallbackProduct } from '../../src/constants/products';

export default function TesterDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { addItem, totalItems } = useCartStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();

  const fallback = getFallbackProduct(id);

  const { data: fetchedProduct } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productService.getProductById(id || 1),
    initialData: fallback,
  });

  const product = fetchedProduct || fallback;

  const isFavorited = product ? isInWishlist(product.id) : false;

  const handleToggleWishlist = () => {
    if (!product) return;
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    toggleWishlist(product);
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    addItem(product, 'tester');
    router.push('/cart' as any);
  };

  const heroHeight = Math.min(height * 0.45, 380);

  if (!product) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <Typography style={styles.loadingText}>Loading luxury...</Typography>
        </View>
      </ScreenContainer>
    );
  }

  const brandName = product.brand?.name || 'KIEHLS';

  return (
    <View style={styles.container}>
      {/* Top Floating Navigation Bar */}
      <View style={[styles.topNavBar, { paddingTop: insets.top > 0 ? insets.top + 6 : 14 }]}>
        <TouchableOpacity
          style={styles.navCircleBtn}
          activeOpacity={0.8}
          onPress={() => router.back()}
        >
          <ChevronLeft size={20} color="#1A1918" strokeWidth={2} />
        </TouchableOpacity>

        <View style={styles.navRightRow}>
          <TouchableOpacity
            style={styles.navCircleBtn}
            activeOpacity={0.8}
            onPress={handleToggleWishlist}
          >
            <Heart
              size={18}
              color={isFavorited ? '#CB6D73' : '#1A1918'}
              fill={isFavorited ? '#CB6D73' : 'transparent'}
              strokeWidth={1.75}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navCircleBtn}
            activeOpacity={0.8}
            onPress={() => router.push('/cart' as any)}
          >
            <ShoppingBag size={18} color="#1A1918" strokeWidth={1.75} />
            {totalItems > 0 && (
              <View style={styles.cartBadge}>
                <Typography style={styles.cartBadgeText}>{totalItems}</Typography>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* Top Product Hero Photography */}
        <View style={[styles.heroImageContainer, { height: heroHeight }]}>
          <Image
            source={{ uri: product.image_url || 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=800&auto=format&fit=crop' }}
            style={styles.heroImage}
            contentFit="cover"
          />
        </View>

        {/* White Rounded Bottom Card */}
        <View style={styles.cardSheet}>
          <View style={styles.sheetHandle} />

          <Typography style={styles.brandName}>{brandName.toUpperCase()}</Typography>

          <View style={styles.titleRow}>
            <Typography style={styles.productTitle}>{product.name}</Typography>

            <View style={styles.miniatureBadge}>
              <Gift size={12} color="#CB6D73" strokeWidth={2} />
              <Typography style={styles.miniatureBadgeText}>MINIATURE</Typography>
            </View>
          </View>

          <Typography style={styles.sizeLabel}>TRIAL & TESTER EDITION</Typography>
          <Typography style={styles.priceText}>₹{product.tester_price}</Typography>

          {/* Main Primary CTA Button */}
          <TouchableOpacity
            style={styles.addToCollectionBtn}
            activeOpacity={0.85}
            onPress={handleAddToCart}
          >
            <Typography style={styles.addToCollectionText}>Try The Miniature</Typography>
            <View style={styles.btnBagCircle}>
              <ShoppingBag size={15} color="#FFFFFF" strokeWidth={2} />
            </View>
          </TouchableOpacity>

          {/* 3-Column Feature Highlight Card */}
          <View style={styles.featuresCard}>
            <View style={styles.featureCol}>
              <Repeat size={20} color="#CB6D73" strokeWidth={1.5} />
              <Typography style={styles.featureLabel}>90% Upgrade{'\n'}Credit</Typography>
            </View>

            <View style={styles.featureDivider} />

            <View style={styles.featureCol}>
              <Sparkles size={20} color="#CB6D73" strokeWidth={1.5} />
              <Typography style={styles.featureLabel}>3-5 Day{'\n'}Trial Experience</Typography>
            </View>

            <View style={styles.featureDivider} />

            <View style={styles.featureCol}>
              <ShieldCheck size={20} color="#CB6D73" strokeWidth={1.5} />
              <Typography style={styles.featureLabel}>100% Authentic{'\n'}Formula</Typography>
            </View>
          </View>

          {/* The Trial Experience Section */}
          <View style={styles.experienceSection}>
            <Typography style={styles.experienceHeading}>The Trial Experience</Typography>
            <Typography style={styles.experienceBody}>
              Experience {product.name} without the commitment. This exquisite miniature contains enough product for an immersive trial on your skin. When you love it, 90% of your tester spend is credited to your Tryvia Wallet!
            </Typography>

            <View style={styles.benefitsRow}>
              <View style={styles.benefitItem}>
                <View style={styles.benefitIconCircle}>
                  <Zap size={16} color="#8E857C" strokeWidth={1.75} />
                </View>
                <Typography style={styles.benefitText}>Instant Wallet Credit</Typography>
              </View>

              <View style={styles.benefitItem}>
                <View style={styles.benefitIconCircle}>
                  <Gift size={16} color="#8E857C" strokeWidth={1.75} />
                </View>
                <Typography style={styles.benefitText}>Travel Friendly Size</Typography>
              </View>

              <View style={styles.benefitItem}>
                <View style={styles.benefitIconCircle}>
                  <ShieldCheck size={16} color="#8E857C" strokeWidth={1.75} />
                </View>
                <Typography style={styles.benefitText}>Direct Brand Source</Typography>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#8E8A85',
    fontFamily: 'Inter_500Medium',
    letterSpacing: 1.5,
  },
  topNavBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 10,
    zIndex: 100,
  },
  navRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  navCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    position: 'relative',
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
  heroImageContainer: {
    width: '100%',
    backgroundColor: '#F5F2EC',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  cardSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -28,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 10,
  },
  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DCD6CF',
    alignSelf: 'center',
    marginBottom: 18,
  },
  brandName: {
    color: '#8E8A85',
    fontSize: 11,
    letterSpacing: 1.8,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  productTitle: {
    flex: 1,
    fontFamily: 'CormorantGaramond_700Bold',
    fontSize: 26,
    lineHeight: 30,
    color: '#1A1918',
  },
  miniatureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FDF0F1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#F8D8DC',
  },
  miniatureBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#CB6D73',
    letterSpacing: 0.8,
    fontFamily: 'Inter_700Bold',
  },
  sizeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E8A85',
    letterSpacing: 1,
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
  },
  priceText: {
    fontSize: 30,
    fontWeight: '700',
    color: '#1A1918',
    fontFamily: 'Inter_700Bold',
    marginBottom: 18,
  },
  addToCollectionBtn: {
    backgroundColor: '#1A1918',
    height: 54,
    borderRadius: 27,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  addToCollectionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  btnBagCircle: {
    position: 'absolute',
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2E2B28',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuresCard: {
    backgroundColor: '#FAF7F4',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFEAE4',
    paddingVertical: 14,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  featureCol: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  featureLabel: {
    fontSize: 11,
    color: '#1A1918',
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
    lineHeight: 14,
  },
  featureDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#EAE3DC',
  },
  experienceSection: {
    paddingTop: 4,
  },
  experienceHeading: {
    fontFamily: 'CormorantGaramond_700Bold',
    fontSize: 22,
    color: '#1A1918',
    marginBottom: 8,
  },
  experienceBody: {
    fontSize: 13.5,
    color: '#6E6862',
    lineHeight: 20,
    fontFamily: 'Inter_400Regular',
    marginBottom: 22,
  },
  benefitsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  benefitItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  benefitIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FAF7F4',
    borderWidth: 1,
    borderColor: '#ECE7E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: {
    fontSize: 11,
    color: '#4A443E',
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 14,
  },
});
