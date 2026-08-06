import React, { useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { Typography } from '../../src/components/ui/Typography';
import { PremiumButton } from '../../src/components/ui/PremiumButton';
import { productService } from '../../src/api/services/productService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCartStore } from '../../src/store/useCartStore';
import { theme } from '../../src/theme/theme';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { ShoppingBag, ChevronLeft, Heart } from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp, useAnimatedScrollHandler, useSharedValue, useAnimatedStyle, interpolate } from 'react-native-reanimated';

import { useWishlistStore } from '../../src/store/useWishlistStore';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addItem, totalItems } = useCartStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const scrollY = useSharedValue(0);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productService.getProductById(Number(id)),
  });

  const isFavorited = product ? isInWishlist(product.id) : false;

  const handleToggleWishlist = () => {
    if (!product) return;
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    toggleWishlist(product);
  };

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const imageStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(scrollY.value, [-100, 0, 100], [-50, 0, 50]),
        },
        {
          scale: interpolate(scrollY.value, [-100, 0, 100], [1.2, 1, 1], 'clamp'),
        },
      ],
    };
  });

  const headerStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(scrollY.value, [0, 100], [0, 1], 'clamp'),
    };
  });

  if (isLoading || !product) {
    return (
      <ScreenContainer showOrbs={true}>
        <View style={styles.loadingContainer}>
          <Typography variant="body" color="secondary" style={{ letterSpacing: 2 }}>LOADING LUXURY...</Typography>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer showOrbs={false}>
      
      {/* Floating Transparent Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <Animated.View style={[StyleSheet.absoluteFill, headerStyle]}>
          <BlurView  intensity={80} tint="light" style={StyleSheet.absoluteFill as any} />
        </Animated.View>

        <TouchableOpacity onPress={() => router.back()} style={styles.iconCircleBtn}>
           <BlurView  intensity={40} tint="light" style={StyleSheet.absoluteFill as any} />
           <ChevronLeft size={24} color={theme.colors.text.primary} strokeWidth={1.5} />
        </TouchableOpacity>
        
        <View style={{ flex: 1 }} />
        
        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={[styles.iconCircleBtn, { marginRight: 12 }]}
            onPress={handleToggleWishlist}
          >
             <BlurView  intensity={40} tint="light" style={StyleSheet.absoluteFill as any} />
             <Heart
               size={20}
               color={isFavorited ? '#E11D48' : theme.colors.text.primary}
               fill={isFavorited ? '#E11D48' : 'none'}
               strokeWidth={1.5}
             />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconCircleBtn} onPress={() => router.push('/cart' as any)}>
            <BlurView  intensity={40} tint="light" style={StyleSheet.absoluteFill as any} />
            <ShoppingBag size={20} color={theme.colors.text.primary} strokeWidth={1.5} />
            {totalItems > 0 && (
              <View style={styles.badge}>
                <Typography variant="caption" style={{ color: '#fff', fontSize: 10 }}>{totalItems}</Typography>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <Animated.ScrollView 
        showsVerticalScrollIndicator={false} 
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
      >
        
        {/* Immersive Image Gallery */}
        <View style={styles.imageGallery}>
           <Animated.View style={[styles.imageWrapper, imageStyle]}>
             <Image source={{ uri: product.image_url || 'https://via.placeholder.com/600' }} style={styles.mainImage} contentFit="cover" />
           </Animated.View>
        </View>

        {/* Content Section - Overlapping the image */}
        <Animated.View entering={FadeInUp.duration(1000).delay(300)} style={styles.contentSection}>
          <View style={styles.contentGlass}>
            <BlurView  intensity={60} tint="light" style={StyleSheet.absoluteFill as any} />
            <View style={styles.contentBorder} />
            
            <View style={styles.contentPadding}>
              <Typography variant="caption" color="secondary" style={styles.brandName}>
                {product.brand?.name?.toUpperCase()}
              </Typography>
              
              <Typography variant="h1" weight="medium" style={styles.productName}>
                {product.name}
              </Typography>


              <View style={styles.priceRow}>
                <View>
                  <Typography variant="caption" color="secondary" style={{ letterSpacing: 2, marginBottom: 4 }}>FULL SIZE</Typography>
                  <Typography variant="h1" weight="medium">₹{product.full_price}</Typography>
                </View>
                <View style={styles.primeTag}>
                   <Typography variant="caption" weight="medium" style={{ color: '#fff', letterSpacing: 1 }}>AUTHENTIC</Typography>
                </View>
              </View>

              {/* Core Actions */}
              <View style={styles.actionsBox}>
                <PremiumButton 
                  title="Add to Collection"
                  onPress={() => {
                    addItem(product, 'full');
                    router.push('/cart' as any);
                  }}
                  style={styles.addToCartBtn}
                />
              </View>
              
              <View style={styles.divider} />

              {/* About this item */}
              <Typography variant="h3" weight="medium" style={{ marginBottom: 24 }}>The Experience</Typography>
              <Typography variant="body" color="secondary" style={styles.description}>
                {product.description || "Discover the ultimate expression of luxury with this iconic formulation. Crafted with the most exquisite ingredients to deliver an unparalleled experience."}
              </Typography>
              
              <View style={styles.highlightsContainer}>
                 <View style={styles.highlightItem}>
                   <View style={styles.highlightDot} />
                   <Typography variant="body" color="secondary">Exquisite formulation</Typography>
                 </View>
                 <View style={styles.highlightItem}>
                   <View style={styles.highlightDot} />
                   <Typography variant="body" color="secondary">Dermatologist approved</Typography>
                 </View>
                 <View style={styles.highlightItem}>
                   <View style={styles.highlightDot} />
                   <Typography variant="body" color="secondary">Sustainably sourced</Typography>
                 </View>
              </View>
            </View>
          </View>
        </Animated.View>
      </Animated.ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
    zIndex: 100,
  },
  headerIcons: {
    flexDirection: 'row',
  },
  iconCircleBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: theme.colors.text.primary,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  imageGallery: {
    width: width,
    height: height * 0.65, 
    position: 'relative',
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  contentSection: {
    marginTop: -80,
    paddingHorizontal: 16,
  },
  contentGlass: {
    borderRadius: 40,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: theme.colors.shadow.glass,
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 20,
  },
  contentBorder: {
    ...(StyleSheet.absoluteFill as any),
    borderRadius: 40,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.8)',
    pointerEvents: 'none',
  },
  contentPadding: {
    padding: 32,
  },
  brandName: {
    letterSpacing: 4,
    marginBottom: 16,
  },
  productName: {
    marginBottom: 16,
    lineHeight: 40,
    fontSize: 32,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    gap: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  primeTag: {
    backgroundColor: theme.colors.text.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  actionsBox: {
    marginBottom: 40,
  },
  addToCartBtn: {
    height: 64,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginBottom: 40,
  },
  description: {
    lineHeight: 28,
    marginBottom: 32,
    fontSize: 16,
  },
  highlightsContainer: {
    gap: 16,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  highlightDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primary.main,
  }
});
