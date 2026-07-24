import React from 'react';
import { View, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { Typography } from '../../src/components/ui/Typography';
import { PremiumButton } from '../../src/components/ui/PremiumButton';
import { useCartStore } from '../../src/store/useCartStore';
import { useTheme } from '../../src/hooks/useTheme';
import { Image } from 'expo-image';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { Alert } from 'react-native';

export default function CartModal() {
  const router = useRouter();
  const theme = useTheme();
  const { items, total, subtotal, walletDeduction, removeItem, checkout } = useCartStore();

  const isMinimumMet = total >= 400; // Mock minimum order value
  const minOrderValue = 400;

  return (
    <ScreenContainer showOrbs={false}>
      <View style={styles.header}>
        <Typography variant="h2">Your Bag</Typography>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Typography variant="h3" color="secondary">✕</Typography>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <Typography variant="body" color="secondary" align="center">
              Your bag is empty.
            </Typography>
          </View>
        ) : (
          items.map((item) => (
            <GlassCard key={item.id} style={styles.cartItem}>
              <Image source={{ uri: item.product.image_url || 'https://via.placeholder.com/150' }} style={styles.itemImage} />
              <View style={styles.itemInfo}>
                <Typography variant="caption" color="secondary">{item.product.brand?.name?.toUpperCase() || 'UNKNOWN BRAND'}</Typography>
                <Typography variant="body" weight="medium">{item.product.name}</Typography>
                <Typography variant="caption" color="secondary" style={{ marginTop: 2 }}>{item.type === 'tester' ? 'Mini/Tester' : 'Full Size'} x{item.quantity}</Typography>
                <Typography variant="body" weight="bold" style={styles.itemPrice}>₹{item.price}</Typography>
              </View>
              <Pressable onPress={() => removeItem(item.id)} style={styles.removeBtn}>
                <Typography variant="caption" color="secondary">Remove</Typography>
              </Pressable>
            </GlassCard>
          ))
        )}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.colors.background.default }]}>
        <View style={styles.progressContainer}>
           <Typography variant="caption" color={isMinimumMet ? 'primary' : 'secondary'}>
             {isMinimumMet 
               ? `✓ Minimum order value (₹${minOrderValue}) met!` 
               : `Add ₹${minOrderValue - total} more to checkout.`
             }
           </Typography>
        </View>

        <View style={styles.totalRow}>
          <Typography variant="body" color="secondary">Subtotal</Typography>
          <Typography variant="body" weight="medium">₹{subtotal}</Typography>
        </View>
        
        {walletDeduction > 0 && (
          <View style={styles.totalRow}>
            <Typography variant="body" color="secondary">Wallet Applied</Typography>
            <Typography variant="body" color="primary" weight="bold">-₹{walletDeduction}</Typography>
          </View>
        )}

        <View style={[styles.totalRow, { marginTop: 8, borderTopWidth: 1, borderColor: 'rgba(0,0,0,0.05)', paddingTop: 16 }]}>
          <Typography variant="h3">Total</Typography>
          <Typography variant="h2" weight="bold">₹{total}</Typography>
        </View>
        
        <PremiumButton 
          title="Proceed to Checkout" 
          onPress={() => {
            checkout();
            Alert.alert("Success!", "Your order was placed successfully. Cashback has been added to your wallet!", [
              { text: "OK", onPress: () => router.back() }
            ]);
          }}
          variant={isMinimumMet && items.length > 0 ? 'primary' : 'secondary'}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 12 : 24,
  },
  closeBtn: {
    padding: 8,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  emptyState: {
    marginTop: 48,
    alignItems: 'center',
  },
  cartItem: {
    flexDirection: 'row',
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 16,
  },
  itemInfo: {
    flex: 1,
  },
  itemPrice: {
    marginTop: 4,
  },
  removeBtn: {
    padding: 8,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
});
