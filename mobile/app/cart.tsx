import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../src/components/ui/ScreenContainer';
import { Typography } from '../src/components/ui/Typography';
import { useCartStore } from '../src/store/useCartStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '../src/components/ui/GlassCard';
import { PremiumButton } from '../src/components/ui/PremiumButton';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { ChevronLeft, Trash2, Plus, Minus, CheckCircle } from 'lucide-react-native';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { theme } from '../src/theme/theme';
import { UpgradeWalletCard } from '../src/components/wallet/UpgradeWalletCard';

import { MockPaymentGatewayModal } from '../src/components/payment/MockPaymentGatewayModal';
import { OrderSuccessModal } from '../src/components/payment/OrderSuccessModal';
import { Order } from '../src/store/useOrderStore';

export default function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { items, subtotal, walletDeduction, total, addItem, removeItem, clearCart, totalItems } = useCartStore();

  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  const handleCheckout = () => {
    setIsPaymentModalVisible(true);
  };

  const handlePaymentSuccess = (order: Order) => {
    setIsPaymentModalVisible(false);
    setCompletedOrder(order);
  };

  const handleViewOrders = () => {
    setCompletedOrder(null);
    router.replace('/(tabs)/profile' as any);
  };

  const handleContinueShopping = () => {
    setCompletedOrder(null);
    router.replace('/(tabs)' as any);
  };

  return (
    <ScreenContainer showOrbs={false}>
      
      {/* Floating Header */}
      <Animated.View entering={FadeIn.duration(1000)} style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconCircleBtn}>
           <BlurView  intensity={40} tint="dark" style={StyleSheet.absoluteFill as any} />
           <ChevronLeft size={24} color={theme.colors.text.primary} strokeWidth={1.5} />
        </TouchableOpacity>
        
        <View style={styles.headerTitle}>
          <Typography variant="h1" weight="medium" style={styles.logo}>YOUR BAG</Typography>
        </View>
        <View style={{ width: 44 }} />
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {items.length === 0 ? (
          <Animated.View entering={FadeInUp.duration(1000).delay(200)} style={styles.emptyState}>
            <GlassCard intensity={15} style={{ padding: 40, alignItems: 'center' }}>
               <Typography variant="h2" style={{ marginBottom: 16, textAlign: 'center' }}>Your bag is empty</Typography>
               <Typography variant="body" color="secondary" style={{ textAlign: 'center', marginBottom: 32 }}>
                 Discover extraordinary pieces to add to your collection.
               </Typography>
               <PremiumButton 
                 title="Discover Luxury" 
                 onPress={() => router.push('/(tabs)' as any)} 
                 variant="glass" 
               />
            </GlassCard>
          </Animated.View>
        ) : (
          <View>
            <Animated.View entering={FadeInUp.duration(1000).delay(200)} style={styles.cartList}>
              {items.map((item, index) => (
                <View key={item.id} style={styles.cartItemWrapper}>
                  {/* Frosted Light Glass Background */}
                  <BlurView  intensity={50} tint="light" style={StyleSheet.absoluteFill as any} />
                  
                  {/* Glass Border */}
                  <View style={styles.cartItemBorder} />

                  <View style={styles.cartItemContent}>
                     <View style={styles.cartItemRow}>
                        <View style={styles.itemImgWrapper}>
                          <Image source={{ uri: item.product.image_url || 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=300' }} style={styles.itemImg} contentFit="cover" />
                          <View style={styles.itemImgBorder} />
                        </View>
                        
                        <View style={styles.itemInfo}>
                          <Typography variant="caption" color="secondary" style={{ letterSpacing: 1.5, marginBottom: 4, fontFamily: 'Inter_600SemiBold', fontSize: 10 }}>
                            {item.product.brand?.name?.toUpperCase() || 'TRYVIA'}
                          </Typography>
                          <Typography variant="body" weight="medium" numberOfLines={2} style={styles.itemName}>
                            {item.product.name}
                          </Typography>
                          <Typography variant="price" weight="bold" color="primary" style={{ marginVertical: 6, fontSize: 20 }}>
                            ₹{item.price}
                          </Typography>
                          
                          <View style={styles.itemTags}>
                             <View style={styles.typeTag}>
                               <Typography variant="caption" weight="bold" style={{ color: '#FFFFFF', letterSpacing: 1, fontSize: 9 }}>
                                 {item.type === 'tester' ? 'MINIATURE' : 'FULL SIZE'}
                               </Typography>
                             </View>
                          </View>
                        </View>
                     </View>

                     {/* Quantity & Actions */}
                     <View style={styles.itemActionsRow}>
                       <View style={styles.qtyBox}>
                         <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.qtyBtn} activeOpacity={0.7}>
                           <Minus size={14} color={theme.colors.text.primary} />
                         </TouchableOpacity>
                         <Typography variant="number" weight="bold" style={styles.qtyText}>{item.quantity}</Typography>
                         <TouchableOpacity onPress={() => addItem(item.product, item.type)} style={styles.qtyBtn} activeOpacity={0.7}>
                           <Plus size={14} color={theme.colors.text.primary} />
                         </TouchableOpacity>
                       </View>
                       
                       <TouchableOpacity style={styles.deleteBtn} onPress={() => removeItem(item.id)} activeOpacity={0.7}>
                         <Trash2 size={16} color={theme.colors.text.secondary} />
                       </TouchableOpacity>
                     </View>
                  </View>
                </View>
              ))}
            </Animated.View>

            <Animated.View entering={FadeInUp.duration(1000).delay(400)} style={styles.billingSummary}>
                <Typography variant="h2" weight="medium" style={{ marginBottom: 20, letterSpacing: 2 }}>SUMMARY</Typography>
                
                <View style={styles.summaryRow}>
                  <Typography variant="body" color="secondary" style={{ letterSpacing: 1 }}>Subtotal</Typography>
                  <Typography variant="price" weight="semibold">₹{subtotal.toFixed(2)}</Typography>
                </View>
               
               {useCartStore.getState().appliedWalletCredit && items.find(i => i.type === 'full') && (
                 <View style={{ marginBottom: 16 }}>
                   <UpgradeWalletCard 
                     credit={useCartStore.getState().appliedWalletCredit!} 
                     fullSizePrice={items.find(i => i.type === 'full')!.product.full_price}
                   />
                 </View>
               )}
               
               <View style={styles.divider} />
               
               <View style={styles.summaryRow}>
                 <Typography variant="h2" weight="medium" style={{ letterSpacing: 1 }}>Total</Typography>
                 <Typography variant="price" weight="bold" style={{ color: theme.colors.text.primary, fontSize: 30 }}>₹{total.toFixed(2)}</Typography>
               </View>

               <View style={{ marginTop: 24 }}>
                 <PremiumButton 
                   title="Checkout Securely"
                   onPress={handleCheckout}
                   disabled={items.length === 0}
                 />
               </View>
            </Animated.View>
          </View>
        )}
        
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Mock Payment Gateway Modal */}
      <MockPaymentGatewayModal
        visible={isPaymentModalVisible}
        onClose={() => setIsPaymentModalVisible(false)}
        onSuccess={handlePaymentSuccess}
      />

      {/* Order Placed Success Modal */}
      <OrderSuccessModal
        visible={!!completedOrder}
        order={completedOrder}
        onViewOrders={handleViewOrders}
        onContinueShopping={handleContinueShopping}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  iconCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  logo: {
    letterSpacing: 4,
    color: theme.colors.text.primary,
  },
  scrollContent: {
    paddingTop: 16,
    paddingHorizontal: 24,
  },
  emptyState: {
    marginTop: 40,
  },
  cartList: {
    marginBottom: 32,
    gap: 20,
  },
  cartItemWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 4,
  },
  cartItemBorder: {
    ...(StyleSheet.absoluteFill as any),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 24,
    pointerEvents: 'none',
  },
  cartItemContent: {
    padding: 16,
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  itemImgWrapper: {
    width: 100,
    height: 100,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F5F5F3',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  itemImg: {
    width: '100%',
    height: '100%',
  },
  itemImgBorder: {
    ...(StyleSheet.absoluteFill as any),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 16,
    pointerEvents: 'none',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  itemName: {
    lineHeight: 20,
    color: theme.colors.text.primary,
  },
  itemTags: {
    flexDirection: 'row',
    marginTop: 4,
  },
  typeTag: {
    backgroundColor: '#121212',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  itemActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  qtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 18,
    padding: 3,
    gap: 10,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  qtyText: {
    minWidth: 20,
    textAlign: 'center',
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: theme.colors.text.primary,
  },
  deleteBtn: {
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 20,
  },
  billingSummary: {
    padding: 24,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 40,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginVertical: 14,
  },
  successScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successCard: {
    padding: 40,
    alignItems: 'center',
    width: '100%',
  }
});
