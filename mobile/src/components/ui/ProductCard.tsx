import React from 'react';
import { View, StyleSheet, Pressable, ViewStyle, Platform, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { Typography } from './Typography';
import { useTheme } from '../../hooks/useTheme';
import { Plus } from 'lucide-react-native';
import { useCartStore } from '../../store/useCartStore';
import { BlurView } from 'expo-blur';

export interface ProductData {
  id: number;
  name: string;
  brand: string;
  fullPrice: number;
  testerPrice: number;
  imageUrl: string;
}

interface ProductCardProps {
  product: ProductData;
  onPress: () => void;
  style?: ViewStyle;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onPress, style }) => {
  const theme = useTheme();
  const { addItem } = useCartStore();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 360;

  const handleAddToCart = (e: any) => {
    e?.stopPropagation?.();
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const cartProduct = {
      id: product.id,
      name: product.name,
      full_price: product.fullPrice,
      tester_price: product.testerPrice,
      image_url: product.imageUrl,
      brand: { id: 0, name: product.brand },
      category: { id: 0, name: 'Category' },
      stock_full: 10,
      stock_tester: 10,
    };
    addItem(cartProduct, 'tester');
  };

  return (
    <Pressable onPress={onPress} style={{ width: '100%' }}>
      {({ pressed }) => (
        <MotiView
          animate={{
            scale: pressed ? 0.97 : 1,
            translateY: pressed ? 2 : 0,
          }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 20,
          }}
          style={[styles.container, style]}
        >
          {/* Outer Glass Card */}
          <View style={[styles.glassWrapper, { 
            borderRadius: isSmallScreen ? theme.radius.lg : theme.radius.xl,
            shadowColor: theme.colors.shadow.glass, 
          }]}>
            <BlurView intensity={35} tint="light" style={styles.blurContainer}>
              
              {/* Product Image Stage */}
              <View style={[styles.imageStage, { backgroundColor: theme.colors.background.default }]}>
                <Image
                  source={{ uri: product.imageUrl }}
                  style={styles.image}
                  contentFit="cover"
                  transition={300}
                />
                
                {/* Floating Tags */}
                <View style={styles.tagContainer}>
                  <BlurView intensity={80} tint="light" style={styles.tagBlur}>
                    <Typography variant="caption" weight="medium" style={styles.tagText}>100+ buys</Typography>
                  </BlurView>
                </View>
                
                {/* Floating Add to Cart */}
                <Pressable onPress={handleAddToCart} hitSlop={8} style={({ pressed: btnPressed }) => [
                  styles.addToCartBtn,
                  btnPressed && { transform: [{ scale: 0.92 }] }
                ]}>
                  <BlurView intensity={60} tint="light" style={styles.cartBtnBlur}>
                    <Plus size={18} color={theme.colors.text.primary} strokeWidth={2} />
                  </BlurView>
                </Pressable>
              </View>

              {/* Product Info */}
              <View style={[styles.infoContainer, isSmallScreen && { padding: 12 }]}>
                <Typography variant="caption" color="secondary" style={styles.brand} numberOfLines={1}>
                  {product.brand?.toUpperCase()}
                </Typography>
                
                <Typography variant="body" weight="medium" style={styles.name} numberOfLines={2}>
                  {product.name}
                </Typography>
                
                <View style={styles.priceDivider} />
                
                <View style={styles.priceRow}>
                  <View style={styles.priceColumn}>
                    <Typography variant="caption" color="secondary" style={styles.priceSubLabel}>TESTER</Typography>
                    <Typography variant="price" weight="bold" color="primary" numberOfLines={1} style={styles.testerPriceText}>
                      ₹{product.testerPrice}
                    </Typography>
                  </View>
                  <View style={[styles.priceColumn, styles.fullPriceContainer]}>
                    <Typography variant="caption" color="secondary" style={styles.priceSubLabel}>FULL SIZE</Typography>
                    <Typography variant="number" weight="regular" color="secondary" numberOfLines={1} style={styles.fullPrice}>
                      ₹{product.fullPrice}
                    </Typography>
                  </View>
                </View>
              </View>

            </BlurView>
          </View>
        </MotiView>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'visible',
    marginVertical: 6,
  },
  glassWrapper: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
  },
  blurContainer: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  imageStage: {
    width: '100%',
    aspectRatio: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  addToCartBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  cartBtnBlur: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
  },
  tagContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    borderRadius: 8,
    overflow: 'hidden',
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  tagBlur: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  tagText: {
    fontSize: 9,
    letterSpacing: 0.5,
  },
  infoContainer: {
    padding: 14,
  },
  brand: {
    letterSpacing: 1.5,
    marginBottom: 4,
    fontSize: 9,
    fontFamily: 'Inter_600SemiBold',
  },
  name: {
    minHeight: 38,
    lineHeight: 18,
    marginBottom: 8,
    fontSize: 13,
  },
  priceDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  priceColumn: {
    justifyContent: 'flex-end',
    flexShrink: 1,
  },
  priceSubLabel: {
    fontSize: 8,
    letterSpacing: 0.5,
    marginBottom: 1,
    fontFamily: 'Inter_600SemiBold',
  },
  testerPriceText: {
    fontSize: 15,
  },
  fullPriceContainer: {
    alignItems: 'flex-end',
  },
  fullPrice: {
    textDecorationLine: 'line-through',
    fontSize: 12,
  },
});

