import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../src/components/ui/ScreenContainer';
import { Typography } from '../src/components/ui/Typography';
import { useCartStore } from '../src/store/useCartStore';
import { GlassCard } from '../src/components/ui/GlassCard';
import { PremiumButton } from '../src/components/ui/PremiumButton';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { ChevronLeft, Trash2, Plus, Minus } from 'lucide-react-native';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { theme } from '../src/theme/theme';
import { UpgradeWalletCard } from '../src/components/wallet/UpgradeWalletCard';
import { useResponsive } from '../src/hooks/useResponsive';

export default function CartScreen() {
  const router = useRouter();
  const { width, safeTopPadding, insets, isSmallDevice } = useResponsive();
  const { items, subtotal, total, addItem, removeItem } = useCartStore();

  const handleCheckout = () => {
    router.push('/checkout' as any);
  };

  const imgSize = Math.min(84, Math.max(68, width * 0.2));

  return (
    <ScreenContainer showOrbs={false}>
      
      {/* Floating Header */}
      <Animated.View entering={FadeIn.duration(1000)} style={[styles.header, { paddingTop: safeTopPadding }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconCircleBtn} hitSlop={8}>
           <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill as any} />
           <ChevronLeft size={22} color={theme.colors.text.primary} strokeWidth={1.5} />
        </TouchableOpacity>
        
        <View style={styles.headerTitle}>
          <Typography variant="h2" weight="medium" style={styles.logo}>YOUR BAG</Typography>
        </View>
        <View style={{ width: 42 }} />
      </Animated.View>

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 24) + 40 }]} 
        showsVerticalScrollIndicator={false}
      >
        {items.length === 0 ? (
          <Animated.View entering={FadeInUp.duration(1000).delay(200)} style={styles.emptyState}>
            <GlassCard intensity={15} style={{ padding: isSmallDevice ? 24 : 36, alignItems: 'center' }}>
               <Typography variant="h2" align="center" style={{ marginBottom: 12 }}>Your bag is empty</Typography>
               <Typography variant="body" align="center" color="secondary" style={{ marginBottom: 28, lineHeight: 20 }}>
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
              {items.map((item) => (
                <View key={item.id} style={styles.cartItemWrapper}>
                  <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFill as any} />
                  <View style={styles.cartItemBorder} />

                  <View style={[styles.cartItemContent, isSmallDevice && { padding: 12 }]}>
                     <View style={styles.cartItemRow}>
                        <View style={[styles.itemImgWrapper, { width: imgSize, height: imgSize }]}>
                          <Image source={{ uri: item.product.image_url || 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=300' }} style={styles.itemImg} contentFit="cover" />
                          <View style={styles.itemImgBorder} />
                        </View>
                        
                        <View style={styles.itemInfo}>
                          <Typography variant="caption" color="secondary" style={styles.itemBrand} numberOfLines={1}>
                            {item.product.brand?.name?.toUpperCase() || 'TRYVIA'}
                          </Typography>
                          <Typography variant="body" weight="medium" numberOfLines={2} style={styles.itemName}>
                            {item.product.name}
                          </Typography>
                          <Typography variant="price" weight="bold" color="primary" numberOfLines={1} style={styles.itemPrice}>
                            ₹{item.price}
                          </Typography>
                          
                          <View style={styles.itemTags}>
                             <View style={styles.typeTag}>
                               <Typography variant="caption" weight="bold" style={{ color: '#FFFFFF', letterSpacing: 0.5, fontSize: 8 }}>
                                 {item.type === 'tester' ? 'MINIATURE' : 'FULL SIZE'}
                               </Typography>
                             </View>
                          </View>
                        </View>
                     </View>

                     {/* Quantity & Actions */}
                     <View style={styles.itemActionsRow}>
                       <View style={styles.qtyBox}>
                         <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.qtyBtn} activeOpacity={0.7} hitSlop={6}>
                           <Minus size={13} color={theme.colors.text.primary} />
                         </TouchableOpacity>
                         <Typography variant="number" weight="bold" style={styles.qtyText}>{item.quantity}</Typography>
                         <TouchableOpacity onPress={() => addItem(item.product, item.type)} style={styles.qtyBtn} activeOpacity={0.7} hitSlop={6}>
                           <Plus size={13} color={theme.colors.text.primary} />
                         </TouchableOpacity>
                       </View>
                       
                       <TouchableOpacity style={styles.deleteBtn} onPress={() => removeItem(item.id)} activeOpacity={0.7} hitSlop={8}>
                         <Trash2 size={15} color={theme.colors.text.secondary} />
                       </TouchableOpacity>
                     </View>
                  </View>
                </View>
              ))}
            </Animated.View>

            <Animated.View entering={FadeInUp.duration(1000).delay(400)} style={[styles.billingSummary, isSmallDevice && { padding: 16 }]}>
                <Typography variant="h2" weight="medium" style={{ marginBottom: 16, letterSpacing: 1.5, fontSize: 18 }}>SUMMARY</Typography>
                
                <View style={styles.summaryRow}>
                  <Typography variant="body" color="secondary" style={{ letterSpacing: 0.5 }}>Subtotal</Typography>
                  <Typography variant="price" weight="semibold">₹{subtotal.toFixed(2)}</Typography>
                </View>
               
               {useCartStore.getState().appliedWalletCredit && items.find(i => i.type === 'full') && (
                 <View style={{ marginBottom: 12 }}>
                   <UpgradeWalletCard 
                     credit={useCartStore.getState().appliedWalletCredit!} 
                     fullSizePrice={items.find(i => i.type === 'full')!.product.full_price}
                   />
                 </View>
               )}
               
               <View style={styles.divider} />
               
               <View style={styles.summaryRow}>
                 <Typography variant="h2" weight="medium" style={{ letterSpacing: 0.5, fontSize: 18 }}>Total</Typography>
                 <Typography variant="price" weight="bold" style={{ color: theme.colors.text.primary, fontSize: 24 }}>₹{total.toFixed(2)}</Typography>
               </View>

               <View style={{ marginTop: 20 }}>
                 <PremiumButton 
                   title="Checkout Securely"
                   onPress={handleCheckout}
                   disabled={items.length === 0}
                 />
               </View>
            </Animated.View>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  iconCircleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
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
    letterSpacing: 3,
    color: theme.colors.text.primary,
    fontSize: 20,
  },
  scrollContent: {
    paddingTop: 12,
    paddingHorizontal: 20,
  },
  emptyState: {
    marginTop: 32,
  },
  cartList: {
    marginBottom: 24,
    gap: 14,
  },
  cartItemWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cartItemBorder: {
    ...(StyleSheet.absoluteFill as any),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    pointerEvents: 'none',
  },
  cartItemContent: {
    padding: 14,
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemImgWrapper: {
    borderRadius: 14,
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
    borderRadius: 14,
    pointerEvents: 'none',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  itemBrand: {
    letterSpacing: 1,
    marginBottom: 2,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 9,
  },
  itemName: {
    lineHeight: 18,
    fontSize: 13,
    color: theme.colors.text.primary,
  },
  itemPrice: {
    marginVertical: 4,
    fontSize: 17,
  },
  itemTags: {
    flexDirection: 'row',
    marginTop: 2,
  },
  typeTag: {
    backgroundColor: '#121212',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  itemActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  qtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 16,
    padding: 2,
    gap: 8,
  },
  qtyBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    minWidth: 18,
    textAlign: 'center',
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: theme.colors.text.primary,
  },
  deleteBtn: {
    padding: 6,
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 16,
  },
  billingSummary: {
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginVertical: 10,
  },
});

