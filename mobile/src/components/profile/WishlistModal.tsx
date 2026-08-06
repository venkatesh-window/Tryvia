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
import { GlassCard } from '../ui/GlassCard';
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
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />

        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Typography variant="caption" style={styles.subHeader}>
                CURATED FAVORITES
              </Typography>
              <Typography variant="h2" weight="medium" style={{ color: '#fff', marginTop: 2 }}>
                My Wishlist ({items.length})
              </Typography>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {items.length === 0 ? (
              <View style={styles.emptyState}>
                <Heart size={56} color="rgba(255,255,255,0.3)" strokeWidth={1} />
                <Typography variant="h3" style={{ color: '#fff', marginTop: 16, marginBottom: 8 }}>
                  Your Wishlist is Empty
                </Typography>
                <Typography variant="body" color="secondary" align="center" style={{ marginBottom: 24 }}>
                  Tap the heart icon on any product to save it to your bespoke luxury collection.
                </Typography>
                <PremiumButton title="Discover Fragrances" onPress={onClose} variant="primary" />
              </View>
            ) : (
              items.map((product) => (
                <GlassCard key={product.id} intensity={25} style={styles.productCard}>
                  <View style={styles.productRow}>
                    <Image source={{ uri: product.image_url || undefined }} style={styles.productImage} contentFit="cover" />

                    <View style={styles.productInfo}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="caption" color="secondary" style={{ letterSpacing: 1 }}>
                          {product.brand?.name?.toUpperCase() || 'TRYVIA'}
                        </Typography>

                        <TouchableOpacity
                          onPress={() => handleRemove(product.id)}
                          style={styles.trashBtn}
                        >
                          <Trash2 size={16} color="rgba(255,255,255,0.5)" />
                        </TouchableOpacity>
                      </View>

                      <Typography variant="body" weight="medium" numberOfLines={1} style={{ color: '#fff', marginTop: 2 }}>
                        {product.name}
                      </Typography>

                      <View style={styles.priceRow}>
                        <View>
                          <Typography variant="caption" color="secondary">TESTER</Typography>
                          <Typography variant="h3" style={{ color: '#fff', fontSize: 18 }}>₹{product.tester_price}</Typography>
                        </View>
                        <View style={{ marginLeft: 20 }}>
                          <Typography variant="caption" color="secondary">FULL SIZE</Typography>
                          <Typography variant="h3" style={{ color: '#fff', fontSize: 18 }}>₹{product.full_price}</Typography>
                        </View>
                      </View>

                      {/* Move to Bag Action Buttons */}
                      <View style={styles.actionButtonsRow}>
                        <TouchableOpacity
                          style={styles.addTesterBtn}
                          onPress={() => handleMoveToBag(product, 'tester')}
                        >
                          <Sparkles size={13} color="#D4AF37" />
                          <Typography variant="caption" style={{ color: '#D4AF37', marginLeft: 4, fontFamily: 'Inter_600SemiBold' }}>
                            + Tester ₹{product.tester_price}
                          </Typography>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.addFullBtn}
                          onPress={() => handleMoveToBag(product, 'full')}
                        >
                          <ShoppingBag size={13} color="#000" />
                          <Typography variant="caption" style={{ color: '#000', marginLeft: 4, fontFamily: 'Inter_600SemiBold' }}>
                            + Full Size
                          </Typography>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </GlassCard>
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
  },
  content: {
    backgroundColor: '#0F0F11',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  subHeader: {
    color: '#D4AF37',
    fontSize: 11,
    letterSpacing: 2,
    fontFamily: 'Inter_600SemiBold',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  productCard: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
  },
  productRow: {
    flexDirection: 'row',
  },
  productImage: {
    width: 90,
    height: 110,
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
  },
  productInfo: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'space-between',
  },
  trashBtn: {
    padding: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  addTesterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  addFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
});
