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

export default function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { items, subtotal, walletDeduction, total, addItem, removeItem, clearCart, totalItems } = useCartStore();

  const [orderPlaced, setOrderPlaced] = useState(false);

  const handleCheckout = () => {
    setOrderPlaced(true);
    setTimeout(() => {
      clearCart();
      router.push('/(tabs)' as any);
    }, 2500);
  };

  if (orderPlaced) {
    return (
      <ScreenContainer showOrbs={false}>
        <Animated.View entering={FadeIn.duration(1000)} style={styles.successScreen}>
           <GlassCard intensity={20} style={styles.successCard}>
             <CheckCircle size={64} color={theme.colors.primary.main} style={{ marginBottom: 24 }} strokeWidth={1} />
             <Typography variant="h1" weight="medium" style={{ textAlign: 'center', marginBottom: 12 }}>
               Order Confirmed
             </Typography>
             <Typography variant="body" color="secondary" style={{ textAlign: 'center', letterSpacing: 1 }}>
               Welcome to the next level of luxury. Your items are being meticulously prepared.
             </Typography>
           </GlassCard>
        </Animated.View>
      </ScreenContainer>
    );
  }

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
                  {/* Immersive Background Image */}
                  <Image source={{ uri: item.product.image_url || 'https://via.placeholder.com/600' }} style={StyleSheet.absoluteFill as any} contentFit="cover" />
                  
                  {/* Heavy Glass Overlay */}
                  <BlurView  intensity={85} tint="dark" style={StyleSheet.absoluteFill as any} />
                  
                  {/* Glass Border */}
                  <View style={styles.cartItemBorder} />

                  <View style={styles.cartItemContent}>
                     <View style={styles.cartItemRow}>
                        <View style={styles.itemImgWrapper}>
                          <Image source={{ uri: item.product.image_url || 'https://via.placeholder.com/150' }} style={styles.itemImg} contentFit="cover" />
                          <View style={styles.itemImgBorder} />
                        </View>
                        
                        <View style={styles.itemInfo}>
                          <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.7)', letterSpacing: 1, marginBottom: 4 }}>
                            {item.product.brand?.name?.toUpperCase() || 'TRYVIA'}
                          </Typography>
                          <Typography variant="h2" weight="medium" numberOfLines={2} style={styles.itemName}>
                            {item.product.name}
                          </Typography>
                          <Typography variant="h3" style={{ color: '#fff', fontFamily: 'CormorantGaramond_700Bold', marginVertical: 8, fontSize: 22 }}>
                            ₹{item.price}
                          </Typography>
                          
                          <View style={styles.itemTags}>
                             <View style={styles.typeTag}>
                               <Typography variant="caption" weight="bold" style={{ color: '#000', letterSpacing: 1 }}>
                                 {item.type === 'tester' ? 'MINIATURE' : 'FULL SIZE'}
                               </Typography>
                             </View>
                          </View>
                        </View>
                     </View>

                     {/* Quantity & Actions */}
                     <View style={styles.itemActionsRow}>
                       <View style={styles.qtyBox}>
                         <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.qtyBtn}>
                           <Minus size={16} color="#fff" />
                         </TouchableOpacity>
                         <Typography variant="h3" style={styles.qtyText}>{item.quantity}</Typography>
                         <TouchableOpacity onPress={() => addItem(item.product, item.type)} style={styles.qtyBtn}>
                           <Plus size={16} color="#fff" />
                         </TouchableOpacity>
                       </View>
                       
                       <TouchableOpacity style={styles.deleteBtn} onPress={() => removeItem(item.id)}>
                         <Trash2 size={18} color="rgba(255,255,255,0.5)" />
                       </TouchableOpacity>
                     </View>
                  </View>
                </View>
              ))}
            </Animated.View>

            <Animated.View entering={FadeInUp.duration(1000).delay(400)} style={styles.billingSummary}>
               <Typography variant="h2" weight="medium" style={{ marginBottom: 24, letterSpacing: 2 }}>SUMMARY</Typography>
               
                <View style={styles.summaryRow}>
                  <Typography variant="body" color="secondary" style={{ letterSpacing: 1 }}>Subtotal</Typography>
                  <Typography variant="h3" style={{ fontFamily: 'CormorantGaramond_700Bold' }}>₹{subtotal}</Typography>
                </View>
               
               {walletDeduction > 0 && (
                 <View style={styles.summaryRow}>
                   <Typography variant="body" color="secondary" style={{ letterSpacing: 1 }}>Wallet Applied</Typography>
                   <Typography variant="h3" style={{ color: theme.colors.primary.main, fontFamily: 'CormorantGaramond_700Bold' }}>- ₹{walletDeduction}</Typography>
                </View>
               )}
               
               <View style={styles.divider} />
               
               <View style={styles.summaryRow}>
                 <Typography variant="h2" weight="medium" style={{ letterSpacing: 1 }}>Total</Typography>
                 <Typography variant="h1" style={{ color: theme.colors.text.primary, fontFamily: 'CormorantGaramond_700Bold', fontSize: 36 }}>₹{total}</Typography>
               </View>

               <View style={{ marginTop: 32 }}>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  cartItemBorder: {
    ...(StyleSheet.absoluteFill as any),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 24,
  },
  cartItemContent: {
    padding: 16,
  },
  cartItemRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  itemImgWrapper: {
    width: 120,
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  itemImg: {
    width: '100%',
    height: '100%',
  },
  itemImgBorder: {
    ...(StyleSheet.absoluteFill as any),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    borderRadius: 16,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 20,
    justifyContent: 'center',
  },
  itemName: {
    lineHeight: 26,
    fontFamily: 'CormorantGaramond_700Bold',
    color: '#fff',
  },
  itemTags: {
    flexDirection: 'row',
    marginTop: 4,
  },
  typeTag: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,1)',
  },
  itemActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  qtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  qtyText: {
    minWidth: 24,
    textAlign: 'center',
    fontSize: 20,
    fontFamily: 'CormorantGaramond_700Bold',
  },
  deleteBtn: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
  },
  billingSummary: {
    padding: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: 40,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginVertical: 16,
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
