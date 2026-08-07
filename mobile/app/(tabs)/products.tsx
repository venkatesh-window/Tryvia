import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, TextInput } from 'react-native';
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
import { CreditCard, ShoppingBag, Search } from 'lucide-react-native';
import { Image } from 'expo-image';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { name: 'Moisturizer', img: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=300&auto=format&fit=crop' },
  { name: 'Serums', img: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80&w=300&auto=format&fit=crop' },
  { name: 'Sunscreen', img: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=300&auto=format&fit=crop' },
  { name: 'Cleanser', img: 'https://images.unsplash.com/photo-1555820585-c5ae44394b79?q=80&w=300&auto=format&fit=crop' }
];

export default function ProductsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { totalItems } = useCartStore();
  const { user } = useAuthStore();
  const walletBalance = user?.walletBalance || 0;
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const { data: allProducts } = useQuery({
    queryKey: ['allProducts'],
    queryFn: () => productService.getProducts(20),
  });

  return (
    <ScreenContainer showOrbs={true}>
      
      {/* Floating Glass Header */}
      <Animated.View entering={FadeIn.duration(1000)} style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 16) }]}>
        <View style={styles.headerTopRow}>
           <Typography variant="h2" weight="medium" style={styles.logo}>COLLECTION</Typography>
           
           <View style={styles.headerIcons}>
             <BlurView  intensity={30} tint="light" style={styles.walletCapsule}>
                <CreditCard size={14} color={theme.colors.text.primary} />
                <Typography variant="price" weight="bold" color="primary" style={{ marginLeft: 6, fontSize: 14 }}>
                  ₹{walletBalance}
                </Typography>
             </BlurView>
             
             <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/cart' as any)} activeOpacity={0.8}>
               <BlurView  intensity={40} tint="light" style={styles.cartBtnBlur}>
                 <ShoppingBag size={20} color={theme.colors.text.primary} strokeWidth={1.5} />
               </BlurView>
               {totalItems > 0 && (
                 <View style={styles.badge}>
                   <Typography variant="caption" weight="bold" style={{ color: '#fff', fontSize: 10 }}>{totalItems}</Typography>
                 </View>
               )}
             </TouchableOpacity>
           </View>
        </View>

      </Animated.View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Luxury Circular Categories */}
        <Animated.View entering={FadeInUp.duration(1000).delay(400)} style={styles.section}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity 
                key={cat.name}
                style={[styles.categoryCircleWrapper, activeCategory === cat.name && styles.categoryActive]}
                onPress={() => setActiveCategory(activeCategory === cat.name ? null : cat.name)}
              >
                <View style={[styles.categoryCircle, activeCategory === cat.name && styles.categoryActiveCircle]}>
                  <BlurView  intensity={20} tint="light" style={StyleSheet.absoluteFill as any} />
                  <Image source={{ uri: cat.img }} style={styles.categoryImg} contentFit="cover" />
                  <View style={styles.circleBorder} />
                </View>
                <Typography variant="caption" weight={activeCategory === cat.name ? 'bold' : 'medium'} style={{ marginTop: 16, letterSpacing: 2 }}>
                  {cat.name.toUpperCase()}
                </Typography>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Apple-style Staggered Grid Feed */}
        <Animated.View entering={FadeInUp.duration(1000).delay(600)} style={styles.section}>
          <Typography variant="h3" weight="medium" style={styles.sectionTitle}>Full Size Collection</Typography>
          <View style={styles.feedGrid}>
             {allProducts?.map((item, index) => (
                <View key={item.id} style={[styles.gridCard, { marginTop: index % 2 !== 0 ? 40 : 0 }]}>
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
                    style={{ width: '100%', marginRight: 0 }}
                  />
                </View>
             ))}
          </View>
        </Animated.View>
        
        <View style={{ height: 180 }} />
      </ScrollView>
    </ScreenContainer>
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
    letterSpacing: 4,
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
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBtnBlur: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: theme.colors.text.primary,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    zIndex: 10,
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginTop: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    height: 56,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.4)',
    overflow: 'hidden',
    shadowColor: theme.colors.shadow.glass,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
  glassBorder: {
    ...(StyleSheet.absoluteFill as any),
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.8)',
    pointerEvents: 'none',
  },
  searchIcon: {
    marginRight: 16,
    zIndex: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.primary,
    zIndex: 2,
    letterSpacing: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },
  section: {
    marginBottom: 48,
  },
  sectionTitle: {
    paddingHorizontal: 24,
    marginBottom: 32,
    color: theme.colors.text.primary,
    letterSpacing: 1,
  },
  categoryScroll: {
    paddingHorizontal: 24,
    gap: 32,
  },
  categoryCircleWrapper: {
    alignItems: 'center',
    width: 88,
    opacity: 0.8,
  },
  categoryActive: {
    opacity: 1,
  },
  categoryCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
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
    opacity: 0.9,
  },
  circleBorder: {
    ...(StyleSheet.absoluteFill as any),
    borderRadius: 44,
    borderWidth: 1.5,
    borderColor: theme.colors.border.glass,
    pointerEvents: 'none',
  },
  categoryActiveCircle: {
    borderWidth: 3,
    borderColor: theme.colors.primary.dark,
  },
  feedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    rowGap: 32,
  },
  gridCard: {
    width: '46%',
  },
});
