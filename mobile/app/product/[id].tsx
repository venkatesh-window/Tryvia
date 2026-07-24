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

export default function ProductDetailsScreen() {
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
          <Typography variant="body" color="secondary">Loading product details...</Typography>
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
        <Typography variant="body" style={{ flex: 1, letterSpacing: 2 }}>PRODUCT</Typography>
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
           <Image source={{ uri: product.image_url || 'https://via.placeholder.com/600' }} style={styles.mainImage} resizeMode="cover" />
        </View>

        <View style={styles.contentSection}>
          <Typography variant="caption" color="secondary" style={styles.brandName}>
            {product.brand?.name?.toUpperCase()}
          </Typography>
          
          <Typography variant="h2" style={styles.productName}>
            {product.name}
          </Typography>

          <View style={styles.ratingRow}>
             <Typography variant="body" style={{ color: '#FADB5F' }}>★★★★☆</Typography>
             <Typography variant="caption" color="secondary" style={{ marginLeft: 8 }}>1,284 ratings</Typography>
          </View>

          <View style={styles.priceRow}>
            <Typography variant="h1">₹{product.full_price}</Typography>
            <View style={styles.primeTag}>
               <Typography variant="caption" weight="bold" style={{ color: '#fff' }}>FAST DELIVERY</Typography>
            </View>
          </View>

          <Typography variant="caption" color="secondary" style={{ marginBottom: 24 }}>
            Inclusive of all taxes
          </Typography>

          {/* Core Actions */}
          <View style={styles.actionsBox}>
            <PremiumButton 
              title="Add to Cart"
              onPress={() => {
                addItem(product, 'full');
                router.push('/cart' as any);
              }}
              style={styles.addToCartBtn}
            />
            <PremiumButton 
              title="Buy Now"
              variant="ghost"
              onPress={() => {
                addItem(product, 'full');
                router.push('/cart' as any);
              }}
              style={styles.buyNowBtn}
            />
          </View>
          
          <View style={styles.divider} />

          {/* About this item */}
          <Typography variant="h3" style={{ marginBottom: 16 }}>About this item</Typography>
          <Typography variant="body" color="secondary" style={styles.description}>
            {product.description}
          </Typography>
          <View style={{ marginLeft: 16, marginTop: 16, gap: 8 }}>
             <Typography variant="body" color="secondary">• Formulated with premium ingredients</Typography>
             <Typography variant="body" color="secondary">• Dermatologist tested and approved</Typography>
             <Typography variant="body" color="secondary">• Safe for all skin types including sensitive</Typography>
             <Typography variant="body" color="secondary">• Cruelty-free and vegan formula</Typography>
          </View>

          <View style={styles.divider} />

          {/* Detailed Reviews */}
          <Typography variant="h3" style={{ marginBottom: 16 }}>Customer Reviews</Typography>
          
          <View style={styles.reviewCard}>
             <View style={styles.reviewUser}>
                <View style={styles.avatar} />
                <Typography variant="body" weight="bold">Sarah M.</Typography>
             </View>
             <Typography variant="body" style={{ color: '#FADB5F', marginVertical: 8 }}>★★★★★</Typography>
             <Typography variant="body" weight="bold" style={{ marginBottom: 8 }}>Absolutely transformed my skin!</Typography>
             <Typography variant="body" color="secondary">
               "I was hesitant to buy the full size, but after trying the tester I was completely sold. The texture is incredible and it absorbs instantly. Highly recommend!"
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
    height: width, // Square like Amazon
    backgroundColor: '#f9f9f9',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  contentSection: {
    padding: 16,
  },
  brandName: {
    color: '#007185', // Amazon link blue vibe but subtle
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
  primeTag: {
    backgroundColor: '#000',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  actionsBox: {
    gap: 12,
    marginBottom: 24,
  },
  addToCartBtn: {
    borderRadius: 100, // Pill shaped like Amazon
  },
  buyNowBtn: {
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#000',
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
