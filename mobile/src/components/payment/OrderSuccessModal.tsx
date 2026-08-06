import React from 'react';
import { View, StyleSheet, Modal, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Typography } from '../ui/Typography';
import { GlassCard } from '../ui/GlassCard';
import { PremiumButton } from '../ui/PremiumButton';
import { Order } from '../../store/useOrderStore';
import { Image } from 'expo-image';
import { CheckCircle, Sparkles, Package, ArrowRight, MapPin } from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp, ZoomIn } from 'react-native-reanimated';

interface OrderSuccessModalProps {
  visible: boolean;
  order: Order | null;
  onViewOrders: () => void;
  onContinueShopping: () => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  visible,
  order,
  onViewOrders,
  onContinueShopping,
}) => {
  if (!order) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onContinueShopping}>
      <View style={styles.container}>
        <BlurView intensity={95} tint="dark" style={StyleSheet.absoluteFill} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Animated Gold Checkmark */}
          <Animated.View entering={ZoomIn.duration(600)} style={styles.iconContainer}>
            <View style={styles.glowCircle} />
            <CheckCircle size={72} color="#D4AF37" strokeWidth={1.5} />
          </Animated.View>

          {/* Heading */}
          <Animated.View entering={FadeInUp.duration(600).delay(200)} style={styles.headerBlock}>
            <Typography variant="caption" style={styles.confirmedBadge}>
              CONFIRMED & SECURED
            </Typography>
            <Typography variant="h1" weight="medium" style={styles.titleText}>
              Order Placed Successfully
            </Typography>
            <Typography variant="body" color="secondary" style={styles.subtitleText}>
              Thank you for shopping with Tryvia. Your bespoke luxury items are being carefully prepared.
            </Typography>
          </Animated.View>

          {/* Cashback Reward Highlight */}
          {order.cashbackEarned > 0 && (
            <Animated.View entering={FadeInUp.duration(600).delay(300)}>
              <View style={styles.cashbackBanner}>
                <Sparkles size={20} color="#D4AF37" />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Typography variant="caption" style={{ color: '#D4AF37', letterSpacing: 1, fontFamily: 'Inter_600SemiBold' }}>
                    100% TESTER CASHBACK EARNED
                  </Typography>
                  <Typography variant="h3" style={{ color: '#fff', fontSize: 18, marginTop: 2 }}>
                    +₹{order.cashbackEarned} credited to your Tryvia Wallet
                  </Typography>
                </View>
              </View>
            </Animated.View>
          )}

          {/* Order Details Glass Card */}
          <Animated.View entering={FadeInUp.duration(600).delay(400)}>
            <GlassCard intensity={30} style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <Typography variant="caption" color="secondary" style={{ letterSpacing: 1 }}>
                  ORDER REFERENCE
                </Typography>
                <Typography variant="body" weight="bold" style={{ color: '#D4AF37', letterSpacing: 1 }}>
                  #{order.orderNumber}
                </Typography>
              </View>

              <View style={styles.detailRow}>
                <Typography variant="caption" color="secondary" style={{ letterSpacing: 1 }}>
                  PAYMENT METHOD
                </Typography>
                <Typography variant="body" style={{ color: '#fff' }}>
                  {order.paymentMethod}
                </Typography>
              </View>

              <View style={styles.detailRow}>
                <Typography variant="caption" color="secondary" style={{ letterSpacing: 1 }}>
                  ESTIMATED ARRIVAL
                </Typography>
                <Typography variant="body" style={{ color: '#fff' }}>
                  {order.estimatedDelivery}
                </Typography>
              </View>

              <View style={styles.divider} />

              {/* Items List */}
              <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.6)', letterSpacing: 1.5, marginBottom: 12 }}>
                ITEMS IN THIS ORDER ({order.items.length})
              </Typography>

              {order.items.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  <Image source={{ uri: item.imageUrl }} style={styles.itemThumb} contentFit="cover" />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Typography variant="caption" color="secondary">
                      {item.brand.toUpperCase()}
                    </Typography>
                    <Typography variant="body" weight="medium" numberOfLines={1} style={{ color: '#fff' }}>
                      {item.name}
                    </Typography>
                    <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                      {item.type === 'tester' ? 'Mini / Tester' : 'Full Size'} • Qty {item.quantity}
                    </Typography>
                  </View>
                  <Typography variant="h3" style={{ color: '#fff', fontSize: 18 }}>
                    ₹{item.price * item.quantity}
                  </Typography>
                </View>
              ))}

              <View style={styles.divider} />

              {/* Total Row */}
              <View style={styles.totalRow}>
                <Typography variant="h2" weight="medium" style={{ color: '#fff' }}>
                  Amount Paid
                </Typography>
                <Typography variant="h1" style={styles.totalAmount}>
                  ₹{order.total}
                </Typography>
              </View>

              {/* Shipping Address */}
              <View style={styles.addressBox}>
                <MapPin size={16} color="#D4AF37" style={{ marginTop: 2 }} />
                <View style={{ marginLeft: 8, flex: 1 }}>
                  <Typography variant="caption" color="secondary" style={{ letterSpacing: 1 }}>
                    DELIVERY ADDRESS
                  </Typography>
                  <Typography variant="body" style={{ color: '#fff', fontSize: 13, marginTop: 2 }}>
                    {order.shippingAddress.fullName}, {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.pincode}
                  </Typography>
                </View>
              </View>
            </GlassCard>
          </Animated.View>

          {/* Action Buttons */}
          <Animated.View entering={FadeInUp.duration(600).delay(500)} style={styles.actionsContainer}>
            <PremiumButton
              title="Track in My Orders"
              onPress={onViewOrders}
              variant="primary"
            />
            <View style={{ height: 12 }} />
            <PremiumButton
              title="Continue Shopping"
              onPress={onContinueShopping}
              variant="glass"
            />
          </Animated.View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 48,
    alignItems: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  glowCircle: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
  },
  headerBlock: {
    alignItems: 'center',
    marginBottom: 24,
  },
  confirmedBadge: {
    color: '#D4AF37',
    fontSize: 12,
    letterSpacing: 2,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 8,
  },
  titleText: {
    color: '#fff',
    fontSize: 30,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitleText: {
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  cashbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    padding: 16,
    marginBottom: 24,
    width: '100%',
  },
  detailsCard: {
    width: '100%',
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#1A1A1A',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalAmount: {
    color: '#fff',
    fontSize: 32,
    fontFamily: 'CormorantGaramond_700Bold',
  },
  addressBox: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  actionsContainer: {
    width: '100%',
    marginTop: 8,
  },
});
