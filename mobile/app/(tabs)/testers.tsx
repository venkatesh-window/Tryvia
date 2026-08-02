import React from 'react';
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

export default function TestersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { totalItems } = useCartStore();
  const { user } = useAuthStore();
  const walletBalance = user?.walletBalance || 0;

  const { data: testers, isLoading } = useQuery({
    queryKey: ['allTesters'],
    queryFn: () => productService.getTrendingTesters(), 
  });

  return (
    <ScreenContainer showOrbs={true}>
      
      {/* Floating Glass Header */}
      <Animated.View entering={FadeIn.duration(1000)} style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 16) }]}>
        <View style={styles.headerTopRow}>
           <Typography variant="h2" weight="medium" style={styles.logo}>TESTERS</Typography>
           
           <View style={styles.headerIcons}>
             <BlurView  intensity={30} tint="light" style={styles.walletCapsule}>
                <CreditCard size={14} color={theme.colors.text.primary} />
                <Typography variant="h3" weight="bold" color="primary" style={{ marginLeft: 6, fontSize: 14 }}>
                  ₹{walletBalance}
                </Typography>
             </BlurView>
             
             <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/cart' as any)}>
               <BlurView  intensity={30} tint="light" style={styles.cartBtnBlur}>
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
        
        {/* Glass Hero Banner */}
        <Animated.View entering={FadeInUp.duration(1000).delay(400)} style={styles.bannerWrapper}>
           <View style={styles.heroCard}>
             <Image source={{ uri: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=1200&auto=format&fit=crop' }} style={styles.heroImg} contentFit="cover" />
             <BlurView  intensity={20} tint="dark" style={styles.heroOverlay} />
             <View style={styles.glassBorder} />
             
             <View style={styles.heroContent}>
               <Typography variant="h1" weight="medium" style={{ color: '#ffffff', fontSize: 32, marginBottom: 8, letterSpacing: 2 }}>
                 TRY BEFORE{'\n'}YOU BUY
               </Typography>

             </View>
           </View>
        </Animated.View>

        {/* Apple-style Staggered Grid Feed */}
        <Animated.View entering={FadeInUp.duration(1000).delay(600)} style={styles.section}>
          <Typography variant="h3" weight="medium" style={styles.sectionTitle}>Trending Testers</Typography>
          <View style={styles.feedGrid}>
             {isLoading ? (
                <Typography variant="body" color="secondary" style={{ textAlign: 'center', width: '100%' }}>Loading...</Typography>
             ) : (
               testers?.map((item, index) => (
                  <View key={item.id} style={[styles.gridCard, { marginTop: index % 2 !== 0 ? 40 : 0 }]}>
                    <ProductCard 
                      product={{
                        id: item.id,
                        name: item.name,
                        brand: item.brand?.name || 'CHANEL',
                        fullPrice: item.full_price,
                        testerPrice: item.tester_price,
                        imageUrl: item.image_url || 'https://via.placeholder.com/300'
                      }}
                      onPress={() => router.push(`/tester/${item.id}` as any)}
                      style={{ width: '100%', marginRight: 0 }}
                    />
                    

                  </View>
               ))
             )}
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
    paddingTop: 16,
  },
  bannerWrapper: {
    paddingHorizontal: 24,
    marginBottom: 48,
  },
  heroCard: {
    width: '100%',
    aspectRatio: 1, 
    borderRadius: 40,
    overflow: 'hidden',
    shadowColor: theme.colors.shadow.glass,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 10,
    position: 'relative',
  },
  heroImg: {
    ...StyleSheet.absoluteFill as any,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFill as any,
  },
  heroContent: {
    position: 'absolute',
    bottom: 40,
    left: 32,
    right: 32,
    zIndex: 2,
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
  feedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    rowGap: 32,
  },
  gridCard: {
    width: '46%',
    position: 'relative',
  },
  cashbackBadge: {
    position: 'absolute',
    top: -12,
    right: -12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.6)',
    shadowColor: theme.colors.shadow.glass,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  }
});
