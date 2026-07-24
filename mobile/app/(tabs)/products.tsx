import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, TextInput } from 'react-native';
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
import { CreditCard, ShoppingBag } from 'lucide-react-native';

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
      <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 16) }]}>
        <View style={styles.headerTopRow}>
           <Typography variant="h1" style={styles.logo}>SHOP</Typography>
           <View style={styles.headerIcons}>
             <View style={styles.walletCapsule}>
                <CreditCard size={14} color={theme.colors.primary.main} />
                <Typography variant="caption" weight="bold" color="primary" style={{ marginLeft: 6 }}>
                  ₹{walletBalance}
                </Typography>
             </View>
             <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/cart' as any)}>
               <ShoppingBag size={24} color={theme.colors.text.primary} />
               {totalItems > 0 && (
                 <View style={styles.badge}>
                   <Typography variant="caption" style={{ color: '#fff', fontSize: 10 }}>{totalItems}</Typography>
                 </View>
               )}
             </TouchableOpacity>
           </View>
        </View>

        {/* Glass Search Bar */}
        <View style={styles.searchContainer}>
           <View style={styles.searchBox}>
              <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill as any} />
              <View style={styles.glassBorder} />
              <Typography variant="body" color="secondary" style={styles.searchIcon}>⚲</Typography>
              <TextInput 
                placeholder="Search products..." 
                style={styles.searchInput}
                placeholderTextColor={theme.colors.text.secondary}
              />
           </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Visual Categories - Glass Rings */}
        <View style={styles.section}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity 
                key={cat.name}
                style={[styles.categoryCircleWrapper, activeCategory === cat.name && styles.categoryActive]}
                onPress={() => setActiveCategory(activeCategory === cat.name ? null : cat.name)}
              >
                <View style={[styles.categoryCircle, activeCategory === cat.name && styles.categoryActiveCircle]}>
                  <Image source={{ uri: cat.img }} style={StyleSheet.absoluteFill as any} />
                </View>
                <Typography variant="caption" weight={activeCategory === cat.name ? 'bold' : 'medium'} style={{ marginTop: 12 }}>
                  {cat.name}
                </Typography>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* All Products Grid */}
        <View style={styles.section}>
          <Typography variant="h3" style={styles.sectionTitle}>Curated For You</Typography>
          <View style={styles.feedGrid}>
             {allProducts?.map((item) => (
                <View key={item.id} style={styles.gridCard}>
                  <View style={styles.glassCardWrapper}>
                    <BlurView intensity={30} tint="light" style={styles.glassBackground} />
                    <ProductCard 
                      product={{
                        id: item.id,
                        name: item.name,
                        brand: item.brand?.name || 'Unknown',
                        fullPrice: item.full_price,
                        testerPrice: item.tester_price,
                        imageUrl: item.image_url || 'https://via.placeholder.com/300'
                      }}
                      onPress={() => router.push(`/product/${item.id}` as any)}
                    />
                    <View style={styles.glassBorder} />
                  </View>
                </View>
             ))}
          </View>
        </View>
        
        <View style={{ height: 160 }} />
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
    letterSpacing: 2,
    color: theme.colors.text.primary,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBtn: {
    position: 'relative',
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: theme.colors.text.primary,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(165, 150, 180, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginTop: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.radius.xl,
    height: 48,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.background.paper,
    overflow: 'hidden',
    shadowColor: theme.colors.shadow.glass,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  glassBorder: {
    ...StyleSheet.absoluteFill as any,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.glass,
    pointerEvents: 'none',
  },
  searchIcon: {
    marginRight: 12,
    fontSize: 20,
    zIndex: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    color: theme.colors.text.primary,
    zIndex: 2,
  },
  scrollContent: {
    paddingTop: 16,
  },
  section: {
    marginBottom: 40,
  },
  sectionTitle: {
    paddingHorizontal: 24,
    marginBottom: 20,
    color: theme.colors.text.primary,
  },
  categoryScroll: {
    paddingHorizontal: 24,
    gap: 24,
  },
  categoryCircleWrapper: {
    alignItems: 'center',
    width: 80,
    opacity: 0.8,
  },
  categoryActive: {
    opacity: 1,
  },
  categoryCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border.glass,
  },
  categoryActiveCircle: {
    borderWidth: 3,
    borderColor: theme.colors.primary.main, // Blush pink outline
  },
  feedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    rowGap: 24,
  },
  gridCard: {
    width: '47%',
  },
  glassCardWrapper: {
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
    backgroundColor: theme.colors.background.surface,
    shadowColor: theme.colors.shadow.glass,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  glassBackground: {
    ...StyleSheet.absoluteFill as any,
  },
});
