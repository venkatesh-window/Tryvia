import React from 'react';
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
      <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 16) }]}>
        <View style={styles.headerTopRow}>
           <Typography variant="h1" style={styles.logo}>TRIAL</Typography>
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
                placeholder="Search premium minis..." 
                style={styles.searchInput}
                placeholderTextColor={theme.colors.text.secondary}
              />
           </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Glass Hero Banner */}
        <View style={styles.bannerWrapper}>
           <View style={styles.heroCard}>
             <Image source={{ uri: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=1200&auto=format&fit=crop' }} style={styles.heroImg} resizeMode="cover" />
             <BlurView intensity={20} tint="dark" style={styles.heroOverlay} />
             <View style={styles.glassBorder} />
             
             <View style={styles.heroContent}>
               <Typography variant="h1" style={{ color: '#fff', fontSize: 28, marginBottom: 8, letterSpacing: 1 }}>
                 TRY BEFORE{'\n'}YOU BUY
               </Typography>
               <Typography variant="body" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  Earn 50★ on every mini.
               </Typography>
             </View>
           </View>
        </View>

        {/* All Testers Glass Grid */}
        <View style={styles.section}>
          <Typography variant="h3" style={styles.sectionTitle}>Trending Testers</Typography>
          <View style={styles.feedGrid}>
             {isLoading ? (
                <Typography variant="body" color="secondary" style={{ textAlign: 'center', width: '100%' }}>Loading...</Typography>
             ) : (
               testers?.map((item) => (
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
                        onPress={() => router.push(`/tester/${item.id}` as any)}
                      />
                      <View style={styles.glassBorder} />
                      
                      {/* Floating Glass Cashback Badge */}
                      <View style={styles.cashbackBadge}>
                         <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill as any} />
                         <View style={[styles.glassBorder, { borderRadius: 16 }]} />
                         <Typography variant="caption" weight="bold" style={{ color: theme.colors.primary.dark, fontSize: 10 }}>EARN 50★</Typography>
                      </View>
                    </View>
                  </View>
               ))
             )}
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
  bannerWrapper: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  heroCard: {
    width: '100%',
    aspectRatio: 1, // Nice square glass card for the hero
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
    shadowColor: theme.colors.shadow.glass,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
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
    bottom: 32,
    left: 24,
    right: 24,
    zIndex: 2,
  },
  section: {
    marginBottom: 40,
  },
  sectionTitle: {
    paddingHorizontal: 24,
    marginBottom: 20,
    color: theme.colors.text.primary,
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
    position: 'relative',
  },
  glassBackground: {
    ...StyleSheet.absoluteFill as any,
  },
  cashbackBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: theme.colors.background.paper,
  }
});
