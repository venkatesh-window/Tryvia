import React, { useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, useWindowDimensions, FlatList, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { Typography } from '../../src/components/ui/Typography';
import { ProductCard } from '../../src/components/ui/ProductCard';
import { productService } from '../../src/api/services/productService';
import { useCartStore } from '../../src/store/useCartStore';
import { useAuthStore } from '../../src/store/useAuthStore';
import { Image } from 'expo-image';
import { CreditCard, ShoppingBag, Search, SlidersHorizontal, ChevronRight, Sparkles } from 'lucide-react-native';
import { SkincareTubeIcon, LipstickIcon, PerfumeBottleIcon, GiftSetIcon } from '../../src/components/ui/CategoryIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';

const CATEGORIES = [
  { id: '1', name: 'Skincare', Icon: SkincareTubeIcon },
  { id: '2', name: 'Makeup', Icon: LipstickIcon },
  { id: '3', name: 'Fragrance', Icon: PerfumeBottleIcon },
  { id: '4', name: 'Gift Sets', Icon: GiftSetIcon },
];

const HERO_BANNERS = [
  {
    id: '1',
    subtitle: 'Discover. Try.',
    heading: 'Love Beauty',
    desc: 'Curated picks for your\nunique glow',
    btnText: 'Explore Now',
    route: '/(tabs)/minis',
    image: require('../../assets/banner_hero.jpg'),
  },
  {
    id: '2',
    subtitle: 'Artisanal French',
    heading: 'Haute Parfum',
    desc: 'Rare floral extracts\nand golden sillage',
    btnText: 'Discover',
    route: '/(tabs)/products',
    image: require('../../assets/banner_hero_2.jpg'),
  },
  {
    id: '3',
    subtitle: 'Velvet & Satin',
    heading: 'Lip Luxury',
    desc: 'Iconic couture shades\nfor daily elegance',
    btnText: 'Shop Lips',
    route: '/(tabs)/products',
    image: require('../../assets/banner_hero_3.jpg'),
  },
  {
    id: '4',
    subtitle: 'Smart Sampling',
    heading: 'Gift Sets',
    desc: 'Try miniature samples\n& get 90% credit',
    btnText: 'Explore Sets',
    route: '/(tabs)/minis',
    image: require('../../assets/banner_hero_4.jpg'),
  },
];


export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { totalItems } = useCartStore();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const walletBalance = user?.walletBalance || 350;

  const { data: fetchedProducts } = useQuery({
    queryKey: ['homeProducts'],
    queryFn: () => productService.getProducts(14),
  });

  const products = fetchedProducts || [];

  const horizontalPadding = 20;
  const gap = 12;
  const cardWidth = (width - horizontalPadding * 2 - gap) / 2;
  const bannerWidth = width - horizontalPadding * 2;

  // Auto-play timer: smoothly advance the banner every 3.5 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      setActiveBannerIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % HERO_BANNERS.length;
        try {
          flatListRef.current?.scrollToIndex({
            index: nextIndex,
            animated: true,
          });
        } catch (e) {
          // ignore if layout not ready
        }
        return nextIndex;
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [bannerWidth]);

  // Filter products by search or category if active
  const filteredProducts = products.filter(p => {
    const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.brand?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = !activeCategory || p.category?.name?.toLowerCase() === activeCategory.toLowerCase();
    return matchesSearch && matchesCat;
  });

  const handleBannerScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollOffset / bannerWidth);
    if (index >= 0 && index < HERO_BANNERS.length && index !== activeBannerIndex) {
      setActiveBannerIndex(index);
    }
  };

  return (
    <ScreenContainer>
      {/* Top Header Bar */}
      <View style={[styles.headerContainer, { paddingTop: insets.top > 0 ? insets.top + 6 : 14 }]}>
        <View style={styles.headerTopRow}>
          {/* TryVia Brand with Logo */}
          <View style={styles.brandContainer}>
            <Image
              source={require('../../assets/images/main-logo.png')}
              style={styles.logoImage}
              contentFit="contain"
            />
            <Typography style={styles.logo}>TryVia</Typography>
          </View>

          {/* Right Actions: Wallet Pill & Cart Button */}
          <View style={styles.headerRightActions}>
            {/* Wallet Pill */}
            <TouchableOpacity
              style={styles.walletPill}
              activeOpacity={0.8}
              onPress={() => router.push({ pathname: '/(tabs)/profile', params: { openWallet: 'true' } } as any)}
            >
              <CreditCard size={14} color="#1A1918" strokeWidth={2} />
              <Typography style={styles.walletText}>₹{walletBalance}</Typography>
            </TouchableOpacity>

            {/* Shopping Bag Button with Badge */}
            <TouchableOpacity
              style={styles.bagBtn}
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

        {/* Search Bar Row */}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Search size={18} color="#8E8A85" strokeWidth={1.75} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for products, brands..."
              placeholderTextColor="#8E8A85"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity 
              style={styles.filterBtn} 
              activeOpacity={0.7} 
              onPress={() => router.push('/(tabs)/products' as any)}
            >
              <SlidersHorizontal size={18} color="#1A1918" strokeWidth={1.75} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Main Scrollable Content */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Luxury 4-Banner Auto Carousel */}
        <Animated.View entering={FadeInUp.duration(600).delay(100)} style={styles.bannerContainer}>
          <FlatList
            ref={flatListRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            data={HERO_BANNERS}
            keyExtractor={item => item.id}
            getItemLayout={(_, index) => ({
              length: bannerWidth,
              offset: bannerWidth * index,
              index,
            })}
            snapToInterval={bannerWidth}
            decelerationRate="fast"
            onMomentumScrollEnd={handleBannerScroll}
            renderItem={({ item }) => (
              <View style={[styles.bannerSlide, { width: bannerWidth }]}>
                <View style={styles.bannerCard}>
                  {/* Left Banner Text Content */}
                  <View style={styles.bannerLeft}>
                    <Typography style={styles.bannerSubtitle}>{item.subtitle}</Typography>
                    <Typography style={styles.bannerHeading}>{item.heading}</Typography>
                    <Typography style={styles.bannerDesc}>{item.desc}</Typography>
                    <TouchableOpacity
                      style={styles.exploreBtn}
                      activeOpacity={0.85}
                      onPress={() => router.push(item.route as any)}
                    >
                      <Typography style={styles.exploreBtnText}>{item.btnText}</Typography>
                    </TouchableOpacity>
                  </View>

                  {/* Right Banner Image Content */}
                  <View style={styles.bannerImageContainer}>
                    <Image
                      source={item.image}
                      style={styles.bannerImage}
                      contentFit="cover"
                    />
                  </View>
                </View>
              </View>
            )}
          />

          {/* Carousel Dots */}
          <View style={styles.dotsContainer}>
            {HERO_BANNERS.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.dot,
                  idx === activeBannerIndex ? styles.activeDot : styles.inactiveDot
                ]}
              />
            ))}
          </View>
        </Animated.View>

        {/* Quick Links Section */}
        <Animated.View entering={FadeInUp.duration(600).delay(150)} style={styles.quickLinksContainer}>
          {/* Products Pill */}
          <TouchableOpacity
            style={styles.quickLinkBtn}
            activeOpacity={0.8}
            onPress={() => router.push('/(tabs)/products' as any)}
          >
            <ShoppingBag size={18} color="#1A1918" strokeWidth={1.75} style={styles.quickLinkIcon} />
            <Typography style={styles.quickLinkTitle}>Products</Typography>
          </TouchableOpacity>

          {/* Minis Pill */}
          <TouchableOpacity
            style={styles.quickLinkBtn}
            activeOpacity={0.8}
            onPress={() => router.push('/(tabs)/minis' as any)}
          >
            <Sparkles size={18} color="#1A1918" strokeWidth={1.75} style={styles.quickLinkIcon} />
            <Typography style={styles.quickLinkTitle}>Minis</Typography>
          </TouchableOpacity>
        </Animated.View>

        {/* Shop by Category Section */}
        <Animated.View entering={FadeInUp.duration(600).delay(220)} style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Typography style={styles.sectionTitle}>Shop by Category</Typography>
            <TouchableOpacity
              style={styles.viewAllBtn}
              activeOpacity={0.7}
              onPress={() => router.push('/(tabs)/products' as any)}
            >
              <Typography style={styles.viewAllText}>View all</Typography>
              <ChevronRight size={15} color="#8E8A85" />
            </TouchableOpacity>
          </View>

          <View style={styles.categoriesRow}>
            {CATEGORIES.map((cat, idx) => {
              const IconComponent = cat.Icon;
              const isSelected = activeCategory === cat.name;

              return (
                <TouchableOpacity
                  key={cat.id}
                  style={styles.categoryItem}
                  activeOpacity={0.75}
                  onPress={() => setActiveCategory(isSelected ? null : cat.name)}
                >
                  <View style={[styles.categoryCircle, isSelected && styles.selectedCategoryCircle]}>
                    <IconComponent size={26} color={isSelected ? '#CB6D73' : '#1A1918'} strokeWidth={1.5} />
                  </View>
                  <Typography style={[styles.categoryLabel, isSelected && styles.selectedCategoryLabel]}>
                    {cat.name}
                  </Typography>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>

        {/* Curated For You Section */}
        <Animated.View entering={FadeInUp.duration(600).delay(350)} style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Typography style={styles.sectionTitle}>
              {activeCategory ? activeCategory : 'Curated For You'}
            </Typography>
            {filteredProducts.length > 0 && (
              <Typography style={styles.picksCountText}>{filteredProducts.length}+ picks</Typography>
            )}
          </View>

          {/* 2-Column Product Grid OR Luxury Empty State */}
          {filteredProducts.length > 0 ? (
            <View style={styles.productsGrid}>
              {filteredProducts.map((item, idx) => (
                <Animated.View 
                  key={item.id} 
                  entering={FadeInUp.duration(450).delay(380 + Math.min(idx, 6) * 60)} 
                  style={{ width: cardWidth }}
                >
                  <ProductCard
                    product={{
                      id: item.id,
                      name: item.name,
                      brand: item.brand?.name || 'KIEHLS',
                      fullPrice: item.full_price,
                      testerPrice: item.tester_price,
                      imageUrl: item.image_url || 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600&auto=format&fit=crop',
                      category: item.category?.name || 'Skincare',
                    }}
                    onPress={() => router.push(`/product/${item.id}` as any)}
                  />
                </Animated.View>
              ))}
            </View>
          ) : (
            /* Luxury Empty State */
            <Animated.View entering={FadeInUp.duration(400)} style={styles.emptyStateCard}>
              <View style={styles.emptyIconCircle}>
                <Sparkles size={24} color="#CB6D73" strokeWidth={1.75} />
              </View>
              <Typography style={styles.emptyTitle}>No Products Added Yet</Typography>
              <Typography style={styles.emptySubtitle}>
                We are curating exquisite additions for this collection. Stay tuned!
              </Typography>
              <TouchableOpacity
                style={styles.emptyResetBtn}
                activeOpacity={0.85}
                onPress={() => {
                  setActiveCategory(null);
                  setSearchQuery('');
                }}
              >
                <Typography style={styles.emptyResetBtnText}>Explore All Products</Typography>
              </TouchableOpacity>
            </Animated.View>
          )}
        </Animated.View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#FAF8F5',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoImage: {
    width: 30,
    height: 30,
    borderRadius: 8,
  },
  logo: {
    fontFamily: 'CormorantGaramond_700Bold',
    fontSize: 30,
    letterSpacing: 0.5,
    color: '#1A1918',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  walletPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ECE7E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  walletText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1918',
    fontFamily: 'Inter_700Bold',
  },
  bagBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECE7E1',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    height: 48,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#ECE7E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#1A1918',
    fontFamily: 'Inter_400Regular',
    paddingVertical: 0,
  },
  filterBtn: {
    padding: 4,
    marginLeft: 6,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  bannerContainer: {
    marginBottom: 24,
  },
  bannerSlide: {
    overflow: 'hidden',
  },
  bannerCard: {
    backgroundColor: '#F6ECE6',
    borderRadius: 22,
    height: 172,
    flexDirection: 'row',
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#EFE2DA',
  },
  bannerLeft: {
    width: '58%',
    height: '100%',
    paddingLeft: 18,
    paddingVertical: 14,
    justifyContent: 'center',
    zIndex: 2,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: '#3C3834',
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
    marginBottom: 2,
  },
  bannerHeading: {
    fontSize: 26,
    fontWeight: '700',
    fontFamily: 'CormorantGaramond_700Bold',
    color: '#1A1918',
    lineHeight: 28,
    marginBottom: 4,
  },
  bannerDesc: {
    fontSize: 11.5,
    color: '#6E6862',
    lineHeight: 15,
    fontFamily: 'Inter_400Regular',
    marginBottom: 12,
  },
  exploreBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#232127',
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  exploreBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  bannerImageContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '48%',
    height: 172,
    zIndex: 1,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    gap: 5,
  },
  dot: {
    borderRadius: 2.5,
    height: 5,
  },
  activeDot: {
    width: 16,
    backgroundColor: '#232127',
  },
  inactiveDot: {
    width: 5,
    backgroundColor: '#DCD6CF',
  },
  quickLinksContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  quickLinkBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECE7E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  quickLinkIcon: {
    marginRight: 8,
  },
  quickLinkTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1918',
    fontFamily: 'Inter_600SemiBold',
  },
  sectionContainer: {
    marginBottom: 26,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1918',
    fontFamily: 'Inter_700Bold',
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    fontSize: 13,
    color: '#8E8A85',
    fontFamily: 'Inter_400Regular',
  },
  picksCountText: {
    fontSize: 13,
    color: '#8E8A85',
    fontFamily: 'Inter_400Regular',
  },
  categoriesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryItem: {
    alignItems: 'center',
    flex: 1,
  },
  categoryCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECE7E1',
    shadowColor: '#32281E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 8,
  },
  selectedCategoryCircle: {
    borderColor: '#CB6D73',
    backgroundColor: '#FFF8F8',
  },
  categoryLabel: {
    fontSize: 11.5,
    color: '#1A1918',
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
  },
  selectedCategoryLabel: {
    color: '#CB6D73',
    fontWeight: '600',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  emptyStateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECE7E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    marginVertical: 10,
  },
  emptyIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FDF0F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F8D8DC',
  },
  emptyTitle: {
    fontFamily: 'CormorantGaramond_700Bold',
    fontSize: 22,
    color: '#1A1918',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13.5,
    color: '#8E8A85',
    textAlign: 'center',
    lineHeight: 19,
    fontFamily: 'Inter_400Regular',
    marginBottom: 20,
    maxWidth: 260,
  },
  emptyResetBtn: {
    backgroundColor: '#232127',
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 22,
  },
  emptyResetBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
});
