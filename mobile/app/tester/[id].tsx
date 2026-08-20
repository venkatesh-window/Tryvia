import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { Typography } from '../../src/components/ui/Typography';
import { PremiumButton } from '../../src/components/ui/PremiumButton';
import { productService } from '../../src/api/services/productService';
import { useCartStore } from '../../src/store/useCartStore';
import { theme } from '../../src/theme/theme';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { ShoppingBag, ChevronLeft } from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp, useAnimatedScrollHandler, useSharedValue, useAnimatedStyle, interpolate } from 'react-native-reanimated';
import { useResponsive } from '../../src/hooks/useResponsive';

export default function TesterDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width, height, safeTopPadding, insets, isSmallDevice } = useResponsive();
  const { addItem, totalItems } = useCartStore();
  const scrollY = useSharedValue(0);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productService.getProductById(Number(id)),
  });

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

  const heroHeight = Math.min(height * 0.52, 420);

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
      <View style={[styles.header, { paddingTop: safeTopPadding }]}>
        <Animated.View style={[StyleSheet.absoluteFill, headerStyle]}>
          <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill as any} />
        </Animated.View>

        <TouchableOpacity onPress={() => router.back()} style={styles.iconCircleBtn} hitSlop={8}>
           <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill as any} />
           <ChevronLeft size={22} color={theme.colors.text.primary} strokeWidth={1.5} />
        </TouchableOpacity>
        
        <View style={{ flex: 1 }} />
        
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconCircleBtn} onPress={() => router.push('/cart' as any)} hitSlop={8}>
            <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill as any} />
            <ShoppingBag size={18} color={theme.colors.text.primary} strokeWidth={1.5} />
            {totalItems > 0 && (
              <View style={styles.badge}>
                <Typography variant="caption" style={{ color: '#fff', fontSize: 9 }}>{totalItems}</Typography>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <Animated.ScrollView 
        showsVerticalScrollIndicator={false} 
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 20) + 32 }]}
      >
        
        {/* Immersive Image Gallery */}
        <View style={[styles.imageGallery, { width, height: heroHeight }]}>
           <Animated.View style={[styles.imageWrapper, imageStyle]}>
             <Image source={{ uri: product.image_url || 'https://via.placeholder.com/600' }} style={styles.mainImage} contentFit="cover" />
           </Animated.View>
           
           <Animated.View entering={FadeIn.duration(1000).delay(600)} style={styles.testerBadge}>
             <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill as any} />
             <View style={styles.testerBadgeBorder} />
             <Typography variant="caption" weight="bold" style={{ color: '#fff', letterSpacing: 1.5, fontSize: 10 }}>MINIATURE</Typography>
           </Animated.View>
        </View>

        {/* Content Section - Overlapping the image */}
        <Animated.View entering={FadeInUp.duration(1000).delay(300)} style={styles.contentSection}>
          <View style={styles.contentGlass}>
            <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill as any} />
            <View style={styles.contentBorder} />
            
            <View style={[styles.contentPadding, isSmallDevice && { padding: 20 }]}>
              <Typography variant="caption" color="secondary" style={styles.brandName}>
                {product.brand?.name?.toUpperCase()}
              </Typography>
              
              <Typography variant="h1" weight="medium" style={styles.productName}>
                {product.name}
              </Typography>

              <View style={styles.priceRow}>
                <View>
                  <Typography variant="caption" color="secondary" style={{ letterSpacing: 1.5, marginBottom: 2, fontFamily: 'Inter_600SemiBold', fontSize: 9 }}>TRIAL SIZE</Typography>
                  <Typography variant="price" weight="bold" style={{ fontSize: isSmallDevice ? 26 : 30 }}>₹{product.tester_price}</Typography>
                </View>
              </View>

              {/* Core Actions */}
              <View style={styles.actionsBox}>
                <PremiumButton 
                  title="Try The Miniature"
                  onPress={() => {
                    addItem(product, 'tester');
                    router.push('/cart' as any);
                  }}
                />
              </View>
              
              <View style={styles.divider} />

              {/* About this item */}
              <Typography variant="h3" weight="medium" style={{ marginBottom: 16 }}>The Trial Experience</Typography>
              <Typography variant="body" color="secondary" style={styles.description}>
                Experience {product.name} without the commitment. This exquisite miniature contains enough product for an immersive 3-5 day trial, allowing you to discover its texture and fragrance on your own skin before upgrading.
              </Typography>
              
              <View style={styles.highlightsContainer}>
                 <View style={styles.highlightItem}>
                   <View style={styles.highlightDot} />
                   <Typography variant="body" color="secondary">Perfect for travel</Typography>
                 </View>
                 <View style={styles.highlightItem}>
                   <View style={styles.highlightDot} />
                   <Typography variant="body" color="secondary">100% redeemable on upgrade</Typography>
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
    paddingHorizontal: 20,
    paddingBottom: 12,
    zIndex: 100,
  },
  headerIcons: {
    flexDirection: 'row',
  },
  iconCircleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
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
    borderWidth: 1,
    borderColor: '#fff',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  imageGallery: {
    position: 'relative',
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
    padding: 36,
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  testerBadge: {
    position: 'absolute',
    top: 64,
    left: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    overflow: 'hidden',
  },
  testerBadgeBorder: {
    ...(StyleSheet.absoluteFill as any),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: 14,
  },
  contentSection: {
    marginTop: -50,
    paddingHorizontal: 16,
  },
  contentGlass: {
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: theme.colors.shadow.glass,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 16,
  },
  contentBorder: {
    ...(StyleSheet.absoluteFill as any),
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.8)',
    pointerEvents: 'none',
  },
  contentPadding: {
    padding: 24,
  },
  brandName: {
    letterSpacing: 3,
    marginBottom: 10,
    fontSize: 10,
  },
  productName: {
    marginBottom: 12,
    lineHeight: 34,
    fontSize: 26,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  actionsBox: {
    marginBottom: 28,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginBottom: 28,
  },
  description: {
    lineHeight: 24,
    marginBottom: 24,
    fontSize: 14,
  },
  highlightsContainer: {
    gap: 12,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  highlightDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primary.main,
  }
});

