import React from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { Typography } from '../../src/components/ui/Typography';
import { PremiumButton } from '../../src/components/ui/PremiumButton';
import { productService } from '../../src/api/services/productService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCartStore } from '../../src/store/useCartStore';

const { width } = Dimensions.get('window');

export default function TesterDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addItem, totalItems } = useCartStore();

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productService.getProductById(Number(id)),
  });

  if (isLoading || !product) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <Typography variant="body" color="secondary">Loading tester details...</Typography>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer showOrbs={false}>
      {/* Universal Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
           <Typography variant="h3">←</Typography>
        </TouchableOpacity>
        <Typography variant="body" style={{ flex: 1, letterSpacing: 2 }}>TESTER</Typography>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/cart' as any)}>
            <Typography variant="h3">🛍</Typography>
            {totalItems > 0 && (
              <View style={styles.badge}>
                <Typography variant="caption" style={{ color: '#fff', fontSize: 10 }}>{totalItems}</Typography>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Image Gallery */}
        <View style={styles.imageGallery}>
           <Image source={{ uri: product.image_url || 'https://via.placeholder.com/600' }} style={styles.mainImage} resizeMode="contain" />
           <View style={styles.testerOverlayBadge}>
               <Typography variant="caption" weight="bold" style={{ color: '#fff' }}>TESTER SIZE</Typography>
           </View>
        </View>

        <View style={styles.contentSection}>
          <Typography variant="caption" color="secondary" style={styles.brandName}>
            {product.brand?.name?.toUpperCase()}
          </Typography>
          
          <Typography variant="h2" style={styles.productName}>
            {product.name} (Trial Size)
          </Typography>

          <View style={styles.ratingRow}>
             <Typography variant="body" style={{ color: '#FADB5F' }}>★★★★★</Typography>
             <Typography variant="caption" color="secondary" style={{ marginLeft: 8 }}>89 ratings</Typography>
          </View>

          <View style={styles.priceRow}>
            <Typography variant="h1">₹{product.tester_price}</Typography>
            <View style={styles.cashbackTag}>
               <Typography variant="caption" weight="bold" style={{ color: '#fff' }}>EARN 50 ★</Typography>
            </View>
          </View>

          <Typography variant="caption" color="secondary" style={{ marginBottom: 24 }}>
            Inclusive of all taxes
          </Typography>

          {/* Core Actions */}
          <View style={styles.actionsBox}>
            <PremiumButton 
              title="Add Tester to Cart"
              onPress={() => {
                addItem(product, 'tester');
                router.push('/cart' as any);
              }}
              style={styles.addToCartBtn}
            />
          </View>
          
          <View style={styles.divider} />

          {/* About this item */}
          <Typography variant="h3" style={{ marginBottom: 16 }}>About this tester</Typography>
          <Typography variant="body" color="secondary" style={styles.description}>
            Try {product.name} without the commitment. This tester size contains enough product for approximately 3-5 days of use, allowing you to experience the texture, scent, and results on your own skin before upgrading to the full size.
          </Typography>

          <View style={styles.divider} />

          {/* Detailed Reviews */}
          <Typography variant="h3" style={{ marginBottom: 16 }}>Tester Reviews</Typography>
          
          <View style={styles.reviewCard}>
             <View style={styles.reviewUser}>
                <View style={styles.avatar} />
                <Typography variant="body" weight="bold">Jessica T.</Typography>
             </View>
             <Typography variant="body" style={{ color: '#FADB5F', marginVertical: 8 }}>★★★★★</Typography>
             <Typography variant="body" weight="bold" style={{ marginBottom: 8 }}>Perfect trial size!</Typography>
             <Typography variant="body" color="secondary">
               "Glad I bought the tester first. I knew within 2 days that I loved it. Just used my wallet credits to buy the full size!"
             </Typography>
          </View>

          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#fff', 
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    zIndex: 10,
  },
  headerIcons: {
    flexDirection: 'row',
    marginLeft: 16,
  },
  iconBtn: {
    paddingHorizontal: 8,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: 0,
    backgroundColor: '#000',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  imageGallery: {
    width: width,
    height: width, 
    backgroundColor: '#f9f9f9',
    position: 'relative',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  testerOverlayBadge: {
    position: 'absolute',
    top: 24,
    left: 24,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  contentSection: {
    padding: 16,
  },
  brandName: {
    color: '#007185',
    marginBottom: 8,
  },
  productName: {
    marginBottom: 8,
    lineHeight: 32,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 4,
  },
  cashbackTag: {
    backgroundColor: '#e6a8d7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  actionsBox: {
    gap: 12,
    marginBottom: 24,
  },
  addToCartBtn: {
    borderRadius: 100,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginVertical: 24,
  },
  description: {
    lineHeight: 24,
  },
  reviewCard: {
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 12,
  },
  reviewUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ccc',
  },
  bottomSpacer: {
    height: 60,
  }
});
