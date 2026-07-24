import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, FlatList } from 'react-native';
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

const BANNERS = [
  { id: '1', img: 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?q=80&w=1200&auto=format&fit=crop' },
  { id: '2', img: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=1200&auto=format&fit=crop' },
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
    <ScreenContainer showOrbs={true}>
      
      {/* Floating Glass Header - NO SEARCH BAR */}
      <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 16) }]}>
        <View style={styles.headerTopRow}>
           <Typography variant="h1" style={styles.logo}>TRYVIA</Typography>
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
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Responsive Banners with Glass Borders & Large Radius */}
        <View style={styles.bannerWrapper}>
           <FlatList 
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              data={BANNERS}
              keyExtractor={item => item.id}
              renderItem={({item}) => (
                <View style={styles.bannerCard}>
                  <Image source={{ uri: item.img }} style={styles.bannerImg} resizeMode="cover" />
                  <View style={styles.glassBorder} />
                </View>
              )}
           />
        </View>

        {/* Floating Layered Glass Categories */}
        <View style={styles.quickLinksRow}>
           <TouchableOpacity style={styles.quickLinkCard} onPress={() => router.push('/(tabs)/products' as any)}>
              <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill as any} />
              <View style={styles.glassBorder} />
              <Image source={{ uri: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=200&auto=format&fit=crop' }} style={styles.quickLinkImg} />
              <Typography variant="body" weight="bold" style={styles.quickLinkLabel}>PRODUCTS</Typography>
           </TouchableOpacity>
           <TouchableOpacity style={styles.quickLinkCard} onPress={() => router.push('/(tabs)/testers' as any)}>
              <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill as any} />
              <View style={styles.glassBorder} />
              <Image source={{ uri: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?q=80&w=200&auto=format&fit=crop' }} style={styles.quickLinkImg} />
              <Typography variant="body" weight="bold" style={styles.quickLinkLabel}>TESTERS</Typography>
           </TouchableOpacity>
        </View>

        {/* Suggested Horizontal Feed */}
        <View style={styles.section}>
          <Typography variant="h3" style={styles.sectionTitle}>Because you tested Baccarat</Typography>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
            {trendingProducts?.slice(0, 4).map((item) => (
              <View key={item.id} style={styles.hCard}>
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
          </ScrollView>
        </View>

        {/* Vertical Feed */}
        <View style={styles.section}>
          <Typography variant="h3" style={styles.sectionTitle}>Explore More</Typography>
          <View style={styles.feedGrid}>
             {trendingProducts?.map((item) => (
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
    paddingBottom: 12,
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
    backgroundColor: 'rgba(165, 150, 180, 0.15)', // Soft lavender tint
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  scrollContent: {
    paddingTop: 16,
  },
  bannerWrapper: {
    marginBottom: 32,
    paddingHorizontal: 24, // Added padding so banners float
  },
  bannerCard: {
    width: width - 48, // Adjusted width for padding
    marginRight: 16, // Space between horizontal items
    borderRadius: theme.radius.xl, // 32px rounded corners constraint
    overflow: 'hidden',
    shadowColor: theme.colors.shadow.glass,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  bannerImg: {
    width: '100%',
    aspectRatio: 16/9, 
  },
  glassBorder: {
    ...StyleSheet.absoluteFill as any,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.glass,
    pointerEvents: 'none',
  },
  quickLinksRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 40,
  },
  quickLinkCard: {
    flex: 1,
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
    backgroundColor: theme.colors.background.paper, // Translucent white glass
    shadowColor: theme.colors.shadow.glass,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },
  quickLinkImg: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
  },
  quickLinkLabel: {
    textAlign: 'center',
    paddingVertical: 16,
    letterSpacing: 2,
    color: theme.colors.text.primary,
  },
  section: {
    marginBottom: 40,
  },
  sectionTitle: {
    paddingHorizontal: 24,
    marginBottom: 20,
    color: theme.colors.text.primary,
  },
  horizontalList: {
    paddingHorizontal: 24,
    gap: 16,
  },
  hCard: {
    width: 160,
  },
  glassCardWrapper: {
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
    backgroundColor: theme.colors.background.surface,
  },
  glassBackground: {
    ...StyleSheet.absoluteFill as any,
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
});
