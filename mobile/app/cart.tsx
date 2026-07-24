import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../src/components/ui/ScreenContainer';
import { Typography } from '../src/components/ui/Typography';
import { useCartStore } from '../src/store/useCartStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
        <View style={styles.successScreen}>
           <Typography variant="h1" style={{ color: '#007185', marginBottom: 16 }}>✓</Typography>
           <Typography variant="h2" style={{ textAlign: 'center', marginBottom: 8 }}>Order placed, thank you!</Typography>
           <Typography variant="body" color="secondary" style={{ textAlign: 'center' }}>
             Confirmation will be sent to your email.
           </Typography>
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
        <Typography variant="body" style={{ flex: 1, letterSpacing: 2 }}>CART</Typography>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.subtotalTopBar}>
           <Typography variant="h3">Subtotal: ₹{subtotal}</Typography>
           <Typography variant="caption" color="secondary">
             {walletDeduction > 0 ? `(Eligible for ₹${walletDeduction} wallet deduction)` : 'No wallet deductions applied'}
           </Typography>
        </View>

        <TouchableOpacity style={styles.proceedBtn} onPress={handleCheckout} disabled={items.length === 0}>
           <Typography variant="body" weight="bold" style={styles.proceedBtnText}>
             Proceed to Buy ({totalItems} items)
           </Typography>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Cart Items */}
        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <Typography variant="h3" style={{ marginBottom: 16 }}>Your Tryvia Cart is empty</Typography>
            <TouchableOpacity onPress={() => router.push('/(tabs)' as any)} style={styles.shopNowBtn}>
               <Typography variant="body" weight="bold">Shop today's deals</Typography>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            {items.map((item) => (
              <View key={item.id} style={styles.cartRow}>
                <View style={styles.cartRowTop}>
                   <Image source={{ uri: item.product.image_url || 'https://via.placeholder.com/150' }} style={styles.itemImg} resizeMode="contain" />
                   
                   <View style={styles.itemInfo}>
                     <Typography variant="body" weight="bold" numberOfLines={2} style={styles.itemName}>
                       {item.product.name}
                     </Typography>
                     <Typography variant="h3" style={styles.itemPrice}>₹{item.price}</Typography>
                     
                     <Typography variant="caption" style={{ color: '#007185' }}>
                       In stock
                     </Typography>

                     <View style={styles.itemTags}>
                        <Typography variant="caption" style={styles.typeTag}>
                          {item.type === 'tester' ? 'TESTER SIZE' : 'FULL SIZE'}
                        </Typography>
                     </View>
                   </View>
                </View>

                {/* Quantity Controls */}
                <View style={styles.cartRowBottom}>
                  <View style={styles.qtyBox}>
                    <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.qtyBtn}>
                      <Typography variant="h3">-</Typography>
                    </TouchableOpacity>
                    <Typography variant="body" style={styles.qtyText}>{item.quantity}</Typography>
                    <TouchableOpacity onPress={() => addItem(item.product, item.type)} style={styles.qtyBtn}>
                      <Typography variant="h3">+</Typography>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity style={styles.deleteLink} onPress={() => removeItem(item.id)}>
                    <Typography variant="caption" style={{ color: '#007185' }}>Delete</Typography>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {items.length > 0 && (
          <View style={styles.billingSummary}>
             <Typography variant="h3" style={{ marginBottom: 16 }}>Order Summary</Typography>
             
             <View style={styles.summaryRow}>
               <Typography variant="body" color="secondary">Items:</Typography>
               <Typography variant="body">₹{subtotal}</Typography>
             </View>
             
             {walletDeduction > 0 && (
               <View style={styles.summaryRow}>
                 <Typography variant="body" color="secondary">Wallet Appled:</Typography>
                 <Typography variant="body" style={{ color: '#B12704' }}>- ₹{walletDeduction}</Typography>
               </View>
             )}
             
             <View style={styles.divider} />
             
             <View style={styles.summaryRow}>
               <Typography variant="h2" style={{ color: '#B12704' }}>Order Total:</Typography>
               <Typography variant="h2" style={{ color: '#B12704' }}>₹{total}</Typography>
             </View>
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
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#82d8d8', // Amazon cart header vibe
    zIndex: 10,
  },
  scrollContent: {
    paddingTop: 16,
  },
  subtotalTopBar: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  proceedBtn: {
    backgroundColor: '#FFD814', // Amazon yellow button
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  proceedBtnText: {
    color: '#0F1111',
  },
  divider: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginVertical: 16,
  },
  emptyState: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  shopNowBtn: {
    backgroundColor: '#FFD814',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  cartRow: {
    paddingHorizontal: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    paddingBottom: 16,
  },
  cartRowTop: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  itemImg: {
    width: 100,
    height: 100,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 16,
  },
  itemName: {
    lineHeight: 20,
    marginBottom: 4,
  },
  itemPrice: {
    marginBottom: 4,
  },
  itemTags: {
    flexDirection: 'row',
    marginTop: 8,
  },
  typeTag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cartRowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F2F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D5D9D9',
  },
  qtyBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  qtyText: {
    paddingHorizontal: 12,
  },
  deleteLink: {
    marginLeft: 24,
    padding: 8,
  },
  billingSummary: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  successScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  }
});
