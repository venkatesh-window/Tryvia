import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../src/components/ui/ScreenContainer';
import { Typography } from '../src/components/ui/Typography';
import { useCartStore } from '../src/store/useCartStore';
import { Image } from 'expo-image';
import { 
  ChevronLeft, 
  Trash2, 
  Plus, 
  Minus, 
  Lock, 
  ShieldCheck, 
  Package, 
  Headphones,
  ShoppingBag,
  Sparkles
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UpgradeWalletCard } from '../src/components/wallet/UpgradeWalletCard';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInUp, FadeOutRight, Layout } from 'react-native-reanimated';

export default function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { items, subtotal, total, addItem, removeItem } = useCartStore();

  const handleCheckout = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push('/checkout' as any);
  };

  const handleQuantityIncrease = (item: any) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    addItem(item.product, item.type);
  };

  const handleQuantityDecrease = (item: any) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    removeItem(item.id);
  };

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View style={[styles.headerContainer, { paddingTop: insets.top > 0 ? insets.top + 6 : 14 }]}>
        <TouchableOpacity
          style={styles.backCircleBtn}
          activeOpacity={0.8}
          onPress={() => router.back()}
        >
          <ChevronLeft size={20} color="#1A1918" strokeWidth={2} />
        </TouchableOpacity>

        <Typography style={styles.headerTitle}>YOUR BAG</Typography>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 60 }]}
        showsVerticalScrollIndicator={false}
      >
        {items.length === 0 ? (
          /* Empty Bag State */
          <Animated.View entering={FadeInUp.duration(500)} style={styles.emptyStateCard}>
            <View style={styles.emptyIconCircle}>
              <ShoppingBag size={26} color="#CB6D73" strokeWidth={1.5} />
            </View>
            <Typography style={styles.emptyTitle}>Your Bag is Empty</Typography>
            <Typography style={styles.emptySubtitle}>
              Discover extraordinary pieces to add to your luxury collection.
            </Typography>
            <TouchableOpacity
              style={styles.emptyButton}
              activeOpacity={0.85}
              onPress={() => router.push('/(tabs)' as any)}
            >
              <Typography style={styles.emptyButtonText}>Discover Luxury</Typography>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <View>
            {/* Cart Items List */}
            <View style={styles.itemsList}>
              {items.map((item, idx) => (
                <Animated.View 
                  key={item.id} 
                  layout={Layout.springify().damping(18)}
                  entering={FadeInUp.duration(450).delay(idx * 70)}
                  exiting={FadeOutRight.duration(300)}
                  style={styles.cartCard}
                >
                  {/* Top Item Info Row */}
                  <View style={styles.itemTopRow}>
                    {/* Thumbnail Image */}
                    <View style={styles.thumbnailContainer}>
                      <Image
                        source={{ uri: item.product.image_url || 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=300' }}
                        style={styles.thumbnailImg}
                        contentFit="cover"
                      />
                    </View>

                    {/* Product Details */}
                    <View style={styles.itemDetails}>
                      <Typography style={styles.brandText}>
                        {item.product.brand?.name?.toUpperCase() || 'TRYVIA'}
                      </Typography>

                      <Typography style={styles.itemName} numberOfLines={2}>
                        {item.product.name}
                      </Typography>

                      <Typography style={styles.itemPrice}>
                        ₹{item.price * item.quantity}
                      </Typography>

                      <View style={styles.typeBadge}>
                        <Typography style={styles.typeBadgeText}>
                          {item.type === 'tester' ? 'TESTER' : 'FULL SIZE'}
                        </Typography>
                      </View>
                    </View>
                  </View>

                  {/* Bottom Actions Row: Quantity Stepper & Trash */}
                  <View style={styles.itemBottomRow}>
                    {/* Stepper Pill */}
                    <View style={styles.stepperPill}>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        activeOpacity={0.7}
                        onPress={() => handleQuantityDecrease(item)}
                      >
                        <Minus size={14} color="#1A1918" strokeWidth={2} />
                      </TouchableOpacity>

                      <Typography style={styles.quantityText}>{item.quantity}</Typography>

                      <TouchableOpacity
                        style={styles.stepBtn}
                        activeOpacity={0.7}
                        onPress={() => handleQuantityIncrease(item)}
                      >
                        <Plus size={14} color="#1A1918" strokeWidth={2} />
                      </TouchableOpacity>
                    </View>

                    {/* Delete Button */}
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      activeOpacity={0.7}
                      onPress={() => removeItem(item.id)}
                    >
                      <Trash2 size={16} color="#8E857C" strokeWidth={1.75} />
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              ))}
            </View>

            {/* Smart Upgrade Wallet Card if credit is applied */}
            {useCartStore.getState().appliedWalletCredit && items.find(i => i.type === 'full') && (
              <Animated.View entering={FadeInUp.duration(400)} style={{ marginBottom: 16 }}>
                <UpgradeWalletCard 
                  credit={useCartStore.getState().appliedWalletCredit!} 
                  fullSizePrice={items.find(i => i.type === 'full')!.product.full_price}
                />
              </Animated.View>
            )}

            {/* Order Summary Card */}
            <Animated.View entering={FadeInUp.duration(500).delay(150)} style={styles.summaryCard}>
              <Typography style={styles.summaryTitle}>ORDER SUMMARY</Typography>

              {/* Subtotal */}
              <View style={styles.summaryRow}>
                <Typography style={styles.summaryLabel}>Subtotal</Typography>
                <Typography style={styles.summaryValue}>₹{subtotal.toFixed(2)}</Typography>
              </View>

              <View style={styles.summaryDivider} />

              {/* Total */}
              <View style={styles.totalRow}>
                <Typography style={styles.totalLabel}>Total</Typography>
                <Typography style={styles.totalValue}>₹{total.toFixed(2)}</Typography>
              </View>

              {/* Checkout Securely Button */}
              <TouchableOpacity
                style={styles.checkoutBtn}
                activeOpacity={0.85}
                onPress={handleCheckout}
              >
                <Lock size={16} color="#FFFFFF" strokeWidth={2} />
                <Typography style={styles.checkoutBtnText}>Checkout Securely</Typography>
              </TouchableOpacity>
            </Animated.View>

            {/* Trust Badges */}
            <Animated.View entering={FadeInUp.duration(500).delay(220)} style={styles.trustBadgesRow}>
              <View style={styles.trustItem}>
                <ShieldCheck size={20} color="#8E857C" strokeWidth={1.5} />
                <Typography style={styles.trustText}>Secure{'\n'}Checkout</Typography>
              </View>

              <View style={styles.trustDivider} />

              <View style={styles.trustItem}>
                <Package size={20} color="#8E857C" strokeWidth={1.5} />
                <Typography style={styles.trustText}>Fast & Safe{'\n'}Delivery</Typography>
              </View>

              <View style={styles.trustDivider} />

              <View style={styles.trustItem}>
                <Headphones size={20} color="#8E857C" strokeWidth={1.5} />
                <Typography style={styles.trustText}>24/7{'\n'}Support</Typography>
              </View>
            </Animated.View>

            {/* Bottom Safe Disclaimer */}
            <View style={styles.disclaimerRow}>
              <ShieldCheck size={13} color="#8E8A85" strokeWidth={1.75} />
              <Typography style={styles.disclaimerText}>Your payment details are safe with us.</Typography>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: '#FAF8F5',
  },
  backCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5EFEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'CormorantGaramond_700Bold',
    fontSize: 18,
    letterSpacing: 4,
    color: '#1A1918',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  itemsList: {
    gap: 16,
    marginBottom: 20,
  },
  cartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECE7E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  thumbnailContainer: {
    width: 100,
    height: 100,
    borderRadius: 18,
    backgroundColor: '#F5F2EC',
    overflow: 'hidden',
  },
  thumbnailImg: {
    width: '100%',
    height: '100%',
  },
  itemDetails: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  brandText: {
    color: '#8E8A85',
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
  itemName: {
    fontFamily: 'CormorantGaramond_700Bold',
    fontSize: 17,
    lineHeight: 20,
    color: '#1A1918',
    marginBottom: 4,
  },
  itemPrice: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: '#1A1918',
    marginBottom: 6,
  },
  typeBadge: {
    backgroundColor: '#FAF4EF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  typeBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#8E857C',
    letterSpacing: 0.8,
    fontFamily: 'Inter_700Bold',
  },
  itemBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
  },
  stepperPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF7F4',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ECE7E1',
    height: 38,
    paddingHorizontal: 12,
    gap: 16,
  },
  stepBtn: {
    padding: 4,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1918',
    fontFamily: 'Inter_700Bold',
    minWidth: 16,
    textAlign: 'center',
  },
  deleteBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FAF7F4',
    borderWidth: 1,
    borderColor: '#ECE7E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#ECE7E1',
    padding: 22,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryTitle: {
    color: '#8E8A85',
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#6E6862',
    fontFamily: 'Inter_400Regular',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1918',
    fontFamily: 'Inter_600SemiBold',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#F0ECE6',
    marginVertical: 14,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  totalLabel: {
    fontFamily: 'CormorantGaramond_700Bold',
    fontSize: 22,
    color: '#1A1918',
  },
  totalValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: '#1A1918',
  },
  checkoutBtn: {
    backgroundColor: '#1A1918',
    height: 54,
    borderRadius: 27,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  checkoutBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  trustBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    marginBottom: 14,
  },
  trustItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  trustText: {
    fontSize: 11,
    color: '#1A1918',
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
    lineHeight: 14,
  },
  trustDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#ECE7E1',
  },
  disclaimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingBottom: 20,
  },
  disclaimerText: {
    fontSize: 11.5,
    color: '#8E8A85',
    fontFamily: 'Inter_400Regular',
  },
  emptyStateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECE7E1',
    marginTop: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FDF0F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F8D8DC',
  },
  emptyTitle: {
    fontFamily: 'CormorantGaramond_700Bold',
    fontSize: 24,
    color: '#1A1918',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13.5,
    color: '#8E8A85',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'Inter_400Regular',
    marginBottom: 24,
    maxWidth: 260,
  },
  emptyButton: {
    backgroundColor: '#232127',
    paddingVertical: 12,
    paddingHorizontal: 26,
    borderRadius: 24,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
});
