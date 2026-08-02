import React from 'react';
import { View, StyleSheet, Pressable, ViewStyle, Platform } from 'react-native';
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

  const handleAddToCart = () => {
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
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <MotiView
          animate={{
            scale: pressed ? 0.96 : 1,
            translateY: pressed ? 2 : 0,
          }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 20,
          }}
          style={[styles.container, { width: 200, marginRight: 16 }, style]}
        >
          {/* Outer Glass Card */}
          <View style={[styles.glassWrapper, { 
            borderRadius: theme.radius.xl,
            shadowColor: theme.colors.shadow.glass, 
          }]}>
            <BlurView  intensity={35} tint="light" style={styles.blurContainer}>
              
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
                  <BlurView  intensity={80} tint="light" style={styles.tagBlur}>
                    <Typography variant="caption" weight="medium" style={styles.tagText}>100+ buys</Typography>
                  </BlurView>
                </View>
                
                {/* Floating Add to Cart */}
                <Pressable onPress={handleAddToCart} style={({ pressed }) => [
                  styles.addToCartBtn,
                  pressed && { transform: [{ scale: 0.9 }] }
                ]}>
                  <BlurView  intensity={50} tint="light" style={styles.cartBtnBlur}>
                    <Plus size={20} color={theme.colors.text.primary} strokeWidth={1.5} />
                  </BlurView>
                </Pressable>
              </View>

              {/* Product Info */}
              <View style={styles.infoContainer}>
                <Typography variant="caption" color="secondary" style={styles.brand}>
                  {product.brand.toUpperCase()}
                </Typography>
                
                <Typography variant="body" weight="medium" style={styles.name} numberOfLines={2}>
                  {product.name}
                </Typography>
                
                <View style={styles.priceDivider} />
                
                <View style={styles.priceRow}>
                  <View>
                    <Typography variant="caption" color="secondary" style={{ marginBottom: 2 }}>TESTER</Typography>
                    <Typography variant="h3" weight="bold" color="primary">₹{product.testerPrice}</Typography>
                  </View>
                  <View style={styles.fullPriceContainer}>
                    <Typography variant="caption" color="secondary" style={{ marginBottom: 2 }}>FULL SIZE</Typography>
                    <Typography variant="h3" color="secondary" style={styles.fullPrice}>
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
    marginVertical: 10,
  },
  glassWrapper: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  blurContainer: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  imageStage: {
    height: 200,
    width: '100%',
    overflow: 'hidden',
  },
  image: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  addToCartBtn: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  cartBtnBlur: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  tagContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
    borderRadius: 8,
    overflow: 'hidden',
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  tagBlur: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  tagText: {
    fontSize: 9,
    letterSpacing: 0.5,
  },
  infoContainer: {
    padding: 16,
  },
  brand: {
    letterSpacing: 2,
    marginBottom: 8,
    fontSize: 10,
  },
  name: {
    marginBottom: 16,
    lineHeight: 22,
  },
  priceDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  fullPriceContainer: {
    alignItems: 'flex-end',
  },
  fullPrice: {
    textDecorationLine: 'line-through',
    fontSize: 12, // Override h3 size to be smaller
  },
});
