import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Platform, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { Typography } from '../../src/components/ui/Typography';
import { productService } from '../../src/api/services/productService';
import { walletService, WalletCredit } from '../../src/api/services/walletService';
import { UpgradeWalletCard } from '../../src/components/wallet/UpgradeWalletCard';
import { useCartStore } from '../../src/store/useCartStore';
import { useWishlistStore } from '../../src/store/useWishlistStore';
import { useAuthStore } from '../../src/store/useAuthStore';
import { Image } from 'expo-image';
import { 
  ChevronLeft, 
  Heart, 
  ShoppingBag, 
  Check, 
  Droplets, 
  Leaf, 
  Moon, 
  Sparkles, 
  Waves, 
  ShieldCheck,
  CheckCircle2
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { getFallbackProduct } from '../../src/constants/products';

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { addItem, totalItems } = useCartStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();

  const [selectedSize, setSelectedSize] = useState<'full' | 'tester'>('full');
  const [eligibleCredit, setEligibleCredit] = useState<WalletCredit | null>(null);

  const fallback = getFallbackProduct(id);

  const { data: fetchedProduct } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productService.getProductById(id || 1),
    initialData: fallback,
    enabled: !!id,
  });

  const product = fetchedProduct || fallback;

  useEffect(() => {
    if (product?.id && isAuthenticated) {
      walletService.checkEligibility(product.id).then(res => {
        if (res.eligible && res.credit) {
          setEligibleCredit(res.credit);
        }
      }).catch(e => console.log('Error checking wallet:', e));
    }
  }, [product?.id, isAuthenticated]);

  const isFavorited = product ? isInWishlist(product.id) : false;

  const handleToggleWishlist = () => {
    if (!product) return;
    if (!isAuthenticated) {
      router.push('/auth');
      return;
    }
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    toggleWishlist(product);
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (!isAuthenticated) {
      router.push('/auth');
      return;
    }
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    addItem(product, selectedSize);
    router.push('/cart' as any);
  };

  const currentPrice = selectedSize === 'full' 
    ? product?.full_price || 5200 
    : product?.tester_price || 350;

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

  // Dynamic tags/benefits based on product category & name
  const isFragrance = product.category?.name?.toLowerCase().includes('fragrance') || product.name.toLowerCase().includes('parfum');
  
  const feature1 = isFragrance ? { icon: Sparkles, label: 'Long Lasting\nSillage' } : { icon: Droplets, label: 'Hydrating\nFormula' };
  const feature2 = isFragrance ? { icon: Leaf, label: 'Natural Floral\nEssence' } : { icon: Leaf, label: 'Lightweight\nTexture' };
  const feature3 = isFragrance ? { icon: Moon, label: 'Evening &\nDay Wear' } : { icon: Moon, label: 'Night\nRepair' };

  return (
    <View style={styles.container}>
      {/* Top Floating Navigation Bar */}
      <View style={[styles.topNavBar, { paddingTop: insets.top > 0 ? insets.top + 6 : 14 }]}>
        {/* Back Button */}
        <TouchableOpacity
          style={styles.navCircleBtn}
          activeOpacity={0.8}
          onPress={() => router.back()}
        >
          <ChevronLeft size={20} color="#1A1918" strokeWidth={2} />
        </TouchableOpacity>

        {/* Right Action Buttons */}
        <View style={styles.navRightRow}>
          {/* Wishlist Button */}
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

          {/* Cart Bag Button */}
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
          {/* Top Sheet Drag Indicator */}
          <View style={styles.sheetHandle} />

          {/* Brand Name */}
          <Typography style={styles.brandName}>{brandName.toUpperCase()}</Typography>

          {/* Product Title and Authentic Badge Row */}
          <View style={styles.titleRow}>
            <Typography style={styles.productTitle}>{product.name}</Typography>

            {/* Authentic Pill Badge */}
            <View style={styles.authenticBadge}>
              <Check size={12} color="#55504A" strokeWidth={2.5} />
              <Typography style={styles.authenticBadgeText}>AUTHENTIC</Typography>
            </View>
          </View>

          {/* Size Selector / Label */}
          <View style={styles.sizeRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setSelectedSize('full')}
              style={[styles.sizeOption, selectedSize === 'full' && styles.sizeOptionActive]}
            >
              <Typography style={[styles.sizeOptionText, selectedSize === 'full' && styles.sizeOptionTextActive]}>
                FULL SIZE
              </Typography>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setSelectedSize('tester')}
              style={[styles.sizeOption, selectedSize === 'tester' && styles.sizeOptionActive]}
            >
              <Typography style={[styles.sizeOptionText, selectedSize === 'tester' && styles.sizeOptionTextActive]}>
                TESTER (TRY FIRST)
              </Typography>
            </TouchableOpacity>
          </View>

          {/* Price */}
          <Typography style={styles.priceText}>₹{currentPrice}</Typography>

          {/* Main Primary CTA Button */}
          <TouchableOpacity
            style={styles.addToCollectionBtn}
            activeOpacity={0.85}
            onPress={handleAddToCart}
          >
            <Typography style={styles.addToCollectionText}>Add to Collection</Typography>
            <View style={styles.btnBagCircle}>
              <ShoppingBag size={15} color="#FFFFFF" strokeWidth={2} />
            </View>
          </TouchableOpacity>

          {/* Smart Upgrade Wallet Alert (if user has unlocked credit) */}
          {eligibleCredit && selectedSize === 'full' && (
            <View style={{ marginBottom: 20 }}>
              <UpgradeWalletCard credit={eligibleCredit} fullSizePrice={product.full_price} compact={true} />
            </View>
          )}

          {/* 3-Column Feature Highlight Card */}
          <View style={styles.featuresCard}>
            <View style={styles.featureCol}>
              <feature1.icon size={20} color="#CB6D73" strokeWidth={1.5} />
              <Typography style={styles.featureLabel}>{feature1.label}</Typography>
            </View>

            <View style={styles.featureDivider} />

            <View style={styles.featureCol}>
              <feature2.icon size={20} color="#CB6D73" strokeWidth={1.5} />
              <Typography style={styles.featureLabel}>{feature2.label}</Typography>
            </View>

            <View style={styles.featureDivider} />

            <View style={styles.featureCol}>
              <feature3.icon size={20} color="#CB6D73" strokeWidth={1.5} />
              <Typography style={styles.featureLabel}>{feature3.label}</Typography>
            </View>
          </View>

          {/* The Experience Section */}
          <View style={styles.experienceSection}>
            <Typography style={styles.experienceHeading}>The Experience</Typography>
            <Typography style={styles.experienceBody}>
              {product.description || "A luxurious, lightweight cream that visibly plumps and smooths your skin while you sleep."}
            </Typography>

            {/* Benefit Badges Row */}
            <View style={styles.benefitsRow}>
              <View style={styles.benefitItem}>
                <View style={styles.benefitIconCircle}>
                  <Sparkles size={16} color="#8E857C" strokeWidth={1.75} />
                </View>
                <Typography style={styles.benefitText}>Visibly plumps and smooths</Typography>
              </View>

              <View style={styles.benefitItem}>
                <View style={styles.benefitIconCircle}>
                  <Waves size={16} color="#8E857C" strokeWidth={1.75} />
                </View>
                <Typography style={styles.benefitText}>Deeply hydrates overnight</Typography>
              </View>

              <View style={styles.benefitItem}>
                <View style={styles.benefitIconCircle}>
                  <ShieldCheck size={16} color="#8E857C" strokeWidth={1.75} />
                </View>
                <Typography style={styles.benefitText}>Strengthens skin barrier</Typography>
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
    marginBottom: 14,
  },
  productTitle: {
    flex: 1,
    fontFamily: 'CormorantGaramond_700Bold',
    fontSize: 26,
    lineHeight: 30,
    color: '#1A1918',
  },
  authenticBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F4F0EB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    alignSelf: 'flex-start',
  },
  authenticBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#55504A',
    letterSpacing: 0.8,
    fontFamily: 'Inter_700Bold',
  },
  sizeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  sizeOption: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#FAF7F4',
    borderWidth: 1,
    borderColor: '#ECE7E1',
  },
  sizeOptionActive: {
    backgroundColor: '#FDF0F1',
    borderColor: '#F2CDD1',
  },
  sizeOptionText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8E8A85',
    letterSpacing: 1,
    fontFamily: 'Inter_700Bold',
  },
  sizeOptionTextActive: {
    color: '#CB6D73',
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
