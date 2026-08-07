import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Typography } from '../ui/Typography';
import { PremiumButton } from '../ui/PremiumButton';
import { useWishlistStore } from '../../store/useWishlistStore';
import { useCartStore } from '../../store/useCartStore';
import { Product } from '../../api/schemas/product';
import { Image } from 'expo-image';
import {
  X,
  Heart,
  ShoppingBag,
  Trash2,
  Sparkles,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { theme } from '../../theme/theme';

interface WishlistModalProps {
  visible: boolean;
  onClose: () => void;
  onOpenCart?: () => void;
}

export const WishlistModal: React.FC<WishlistModalProps> = ({
  visible,
  onClose,
  onOpenCart,
}) => {
  const { items, removeFromWishlist } = useWishlistStore();
  const { addItem } = useCartStore();

  const handleMoveToBag = (product: Product, type: 'tester' | 'full') => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    addItem(product, type);
  };

  const handleRemove = (productId: number) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    removeFromWishlist(productId);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        >
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill as any} />
        </TouchableOpacity>

        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Typography variant="caption" weight="bold" style={styles.subHeader}>
                CURATED FAVORITES
              </Typography>
              <Typography variant="h2" weight="medium" style={styles.title}>
                My Wishlist ({items.length})
              </Typography>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={18} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {items.length === 0 ? (
              <View style={styles.emptyState}>
                <Heart size={52} color="#AAAAAA" strokeWidth={1.2} />
                <Typography variant="h3" weight="medium" style={{ color: theme.colors.text.primary, marginTop: 16, marginBottom: 6 }}>
                  Your Wishlist is Empty
                </Typography>
                <Typography variant="body" color="secondary" align="center" style={{ marginBottom: 24, paddingHorizontal: 20 }}>
                  Tap the heart icon on any product to save it to your bespoke luxury collection.
                </Typography>
                <PremiumButton title="Discover Fragrances" onPress={onClose} variant="primary" />
              </View>
            ) : (
              items.map((product) => (
                <View key={product.id} style={styles.productCard}>
                  <View style={styles.productRow}>
                    <Image source={{ uri: product.image_url || 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=200' }} style={styles.productImage} contentFit="cover" />

                    <View style={styles.productInfo}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="caption" color="secondary" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 10 }}>
                          {product.brand?.name?.toUpperCase() || 'TRYVIA'}
                        </Typography>

                        <TouchableOpacity
                          onPress={() => handleRemove(product.id)}
                          style={styles.trashBtn}
                          activeOpacity={0.7}
                        >
                          <Trash2 size={16} color={theme.colors.text.secondary} />
                        </TouchableOpacity>
                      </View>

                      <Typography variant="body" weight="medium" numberOfLines={1} style={{ color: theme.colors.text.primary, marginTop: 2 }}>
                        {product.name}
                      </Typography>

                      <View style={styles.priceRow}>
                        <View>
                          <Typography variant="caption" color="secondary" style={{ fontSize: 9 }}>TESTER</Typography>
                          <Typography variant="price" weight="bold" style={{ color: theme.colors.text.primary, fontSize: 15 }}>₹{product.tester_price}</Typography>
                        </View>
                        <View style={{ marginLeft: 16 }}>
                          <Typography variant="caption" color="secondary" style={{ fontSize: 9 }}>FULL SIZE</Typography>
                          <Typography variant="price" weight="bold" style={{ color: theme.colors.text.primary, fontSize: 15 }}>₹{product.full_price}</Typography>
                        </View>
                      </View>

                      {/* Move to Bag Action Buttons */}
                      <View style={styles.actionButtonsRow}>
                        <TouchableOpacity
                          style={styles.addTesterBtn}
                          onPress={() => handleMoveToBag(product, 'tester')}
                          activeOpacity={0.7}
                        >
                          <Sparkles size={12} color="#B8860B" />
                          <Typography variant="caption" weight="semibold" style={{ color: '#B8860B', marginLeft: 4, fontSize: 11 }}>
                            + Tester ₹{product.tester_price}
                          </Typography>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.addFullBtn}
                          onPress={() => handleMoveToBag(product, 'full')}
                          activeOpacity={0.7}
                        >
                          <ShoppingBag size={12} color="#FFFFFF" />
                          <Typography variant="caption" weight="semibold" style={{ color: '#FFFFFF', marginLeft: 4, fontSize: 11 }}>
                            + Full Size
                          </Typography>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              ))
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 32 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
  },
  subHeader: {
    color: '#B8860B',
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: 2,
  },
  title: {
    color: theme.colors.text.primary,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  productCard: {
    padding: 14,
    borderRadius: 20,
    backgroundColor: '#FAFAF8',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    marginBottom: 14,
  },
  productRow: {
    flexDirection: 'row',
  },
  productImage: {
    width: 84,
    height: 104,
    borderRadius: 14,
    backgroundColor: '#F5F5F3',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  trashBtn: {
    padding: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  addTesterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
  },
  addFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#121212',
    borderRadius: 10,
  },
});
