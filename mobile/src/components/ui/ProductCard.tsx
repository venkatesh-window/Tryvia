import React from 'react';
import { View, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { Typography } from './Typography';
import { useTheme } from '../../hooks/useTheme';
import { Plus } from 'lucide-react-native';
import { useCartStore } from '../../store/useCartStore';

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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Convert ProductData to Product schema for CartStore
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
            scale: pressed ? 0.98 : 1,
          }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 25,
          }}
          style={[styles.container, { backgroundColor: 'transparent', borderRadius: theme.radius.lg }, { shadowColor: theme.colors.shadow.glass, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 }, style]}
        >
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: product.imageUrl }}
              style={[styles.image, { borderTopLeftRadius: theme.radius.lg, borderTopRightRadius: theme.radius.lg }]}
              contentFit="cover"
              transition={200}
            />
            {/* Add to Cart Button Overlay */}
            <Pressable onPress={handleAddToCart} style={styles.addToCartBtn}>
              <Plus size={18} color={theme.colors.text.primary} />
            </Pressable>
          </View>

          <View style={styles.infoContainer}>
            <Typography variant="caption" color="secondary" style={styles.brand}>
              {product.brand.toUpperCase()}
            </Typography>
            <Typography variant="body" weight="medium" style={styles.name} numberOfLines={1}>
              {product.name}
            </Typography>
            
            <View style={styles.priceRow}>
              <View>
                <Typography variant="caption" color="secondary">Tester</Typography>
                <Typography variant="h3" weight="bold">₹{product.testerPrice}</Typography>
              </View>
              <View style={styles.fullPriceContainer}>
                <Typography variant="caption" color="secondary">Full Size</Typography>
                <Typography variant="body" color="secondary" style={styles.fullPrice}>
                  ₹{product.fullPrice}
                </Typography>
              </View>
            </View>
          </View>
        </MotiView>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 220,
    marginRight: 16,
    overflow: 'visible',
  },
  imageContainer: {
    height: 240,
    width: '100%',
    position: 'relative',
  },
  image: {
    flex: 1,
    width: '100%',
    backgroundColor: '#F0F0F0', // Placeholder bg while loading
  },
  addToCartBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(252, 250, 248, 0.9)', // frosted glass white
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  infoContainer: {
    padding: 12,
  },
  brand: {
    letterSpacing: 1,
    marginBottom: 4,
  },
  name: {
    marginBottom: 12,
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
  },
});
