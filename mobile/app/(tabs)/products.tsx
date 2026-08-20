import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
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
import { CreditCard, ShoppingBag, Search } from 'lucide-react-native';
import { Image } from 'expo-image';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useResponsive } from '../../src/hooks/useResponsive';

const CATEGORIES = [
  { id: 1, name: 'Skincare', img: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=300&auto=format&fit=crop' },
  { id: 2, name: 'Fragrance', img: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=300&auto=format&fit=crop' },
  { id: 3, name: 'Haircare', img: 'https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=300&auto=format&fit=crop' },
  { id: 4, name: 'Makeup', img: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?q=80&w=300&auto=format&fit=crop' }
];

export default function ProductsScreen() {
  const router = useRouter();
  const { width, safeTopPadding, bottomTabBarPadding, isSmallDevice } = useResponsive();
  const { totalItems } = useCartStore();
  const { user } = useAuthStore();
  const walletBalance = user?.walletBalance || 0;
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: allProducts, isLoading } = useQuery({
    queryKey: ['allProducts', searchQuery, activeCategory],
    queryFn: () => productService.getProducts(20, searchQuery, activeCategory || undefined),
  });

  const gridCardWidth = (width - 40 - 12) / 2;

  return (
    <ScreenContainer showOrbs={true}>
      
      {/* Floating Glass Header */}
      <Animated.View entering={FadeIn.duration(1000)} style={[styles.headerContainer, { paddingTop: safeTopPadding }]}>
        <View style={styles.headerTopRow}>
           <Typography variant="h2" weight="medium" style={styles.logo} numberOfLines={1}>COLLECTION</Typography>
           
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

      <Animated.View entering={FadeIn.duration(1000).delay(200)} style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill as any} />
          <Search size={18} color={theme.colors.text.secondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products, brands..."
            placeholderTextColor={theme.colors.text.secondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <View style={styles.glassBorder} />
        </View>
      </Animated.View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomTabBarPadding }]} showsVerticalScrollIndicator={false}>
        
        {/* Luxury Circular Categories */}
        <Animated.View entering={FadeInUp.duration(1000).delay(400)} style={styles.section}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity 
                key={cat.id}
                style={[styles.categoryCircleWrapper, activeCategory === cat.id && styles.categoryActive]}
                onPress={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.categoryCircle, activeCategory === cat.id && styles.categoryActiveCircle]}>
                  <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill as any} />
                  <Image source={{ uri: cat.img }} style={styles.categoryImg} contentFit="cover" />
                  <View style={styles.circleBorder} />
                </View>
                <Typography variant="caption" weight={activeCategory === cat.id ? 'bold' : 'medium'} style={{ marginTop: 10, letterSpacing: 1.5, fontSize: 10 }}>
                  {cat.name.toUpperCase()}
                </Typography>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Apple-style Staggered Grid Feed */}
        <Animated.View entering={FadeInUp.duration(1000).delay(600)} style={styles.section}>
          <Typography variant="h3" weight="medium" style={styles.sectionTitle}>Full Size Collection</Typography>
          {isLoading ? (
            <Typography variant="body" color="secondary" style={{ textAlign: 'center', marginTop: 24 }}>Loading products...</Typography>
          ) : allProducts?.length === 0 ? (
            <Typography variant="body" color="secondary" style={{ textAlign: 'center', marginTop: 24 }}>No products found.</Typography>
          ) : (
            <View style={styles.feedGrid}>
               {allProducts?.map((item, index) => (
                  <View key={item.id} style={{ width: gridCardWidth, marginTop: index % 2 !== 0 ? 24 : 0 }}>
                    <ProductCard 
                      product={{
                        id: item.id,
                        name: item.name,
                        brand: item.brand?.name || 'DIOR',
                        fullPrice: item.full_price,
                        testerPrice: item.tester_price,
                        imageUrl: item.image_url || 'https://via.placeholder.com/300'
                      }}
                      onPress={() => router.push(`/product/${item.id}` as any)}
                    />
                  </View>
               ))}
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </ScreenContainer>
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
    flexShrink: 1,
    fontSize: 20,
    letterSpacing: 2,
    color: theme.colors.text.primary,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
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
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    height: 48,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.4)',
    overflow: 'hidden',
    shadowColor: theme.colors.shadow.glass,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  glassBorder: {
    ...(StyleSheet.absoluteFill as any),
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.8)',
    pointerEvents: 'none',
  },
  searchIcon: {
    marginRight: 12,
    zIndex: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.primary,
    zIndex: 2,
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingTop: 12,
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
  categoryScroll: {
    paddingHorizontal: 20,
    gap: 20,
  },
  categoryCircleWrapper: {
    alignItems: 'center',
    minWidth: 80,
    opacity: 0.85,
  },
  categoryActive: {
    opacity: 1,
  },
  categoryCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
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
    opacity: 0.9,
  },
  circleBorder: {
    ...(StyleSheet.absoluteFill as any),
    borderRadius: 36,
    borderWidth: 1.5,
    borderColor: theme.colors.border.glass,
    pointerEvents: 'none',
  },
  categoryActiveCircle: {
    borderWidth: 2.5,
    borderColor: theme.colors.primary.dark,
  },
  feedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    rowGap: 16,
  },
});

