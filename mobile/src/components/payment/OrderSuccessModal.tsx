import React from 'react';
import { View, StyleSheet, Modal, ScrollView, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Typography } from '../ui/Typography';
import { PremiumButton } from '../ui/PremiumButton';
import { Order } from '../../store/useOrderStore';
import { Image } from 'expo-image';
import { CheckCircle, Sparkles, MapPin } from 'lucide-react-native';
import Animated, { FadeInUp, ZoomIn } from 'react-native-reanimated';
import { theme } from '../../theme/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const insets = useSafeAreaInsets();
  if (!order) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onContinueShopping}>
      <View style={styles.container}>
        <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent, 
            { 
              paddingTop: Math.max(insets.top, 24),
              paddingBottom: Math.max(insets.bottom, 24) + 24,
            }
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Animated Gold Checkmark */}
          <Animated.View entering={ZoomIn.duration(600)} style={styles.iconContainer}>
            <View style={styles.glowCircle} />
            <CheckCircle size={68} color="#B8860B" strokeWidth={1.5} />
          </Animated.View>

          {/* Heading */}
          <Animated.View entering={FadeInUp.duration(600).delay(200)} style={styles.headerBlock}>
            <Typography variant="caption" weight="bold" style={styles.confirmedBadge}>
              CONFIRMED & SECURED
            </Typography>
            <Typography variant="h1" weight="medium" style={styles.titleText}>
              Order Placed Successfully
            </Typography>
            <Typography variant="body" color="secondary" style={styles.subtitleText}>
              Thank you for shopping with Tryvia. Your bespoke luxury items are being carefully prepared.
            </Typography>
          </Animated.View>

          {/* Order Details Glass Card */}
          <Animated.View entering={FadeInUp.duration(600).delay(400)} style={{ width: '100%' }}>
            <View style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <Typography variant="caption" color="secondary" style={{ letterSpacing: 1 }}>
                  ORDER REFERENCE
                </Typography>
                <Typography variant="caption" weight="bold" style={{ color: '#B8860B', letterSpacing: 1, fontSize: 13 }}>
                  {order.orderNumber}
                </Typography>
              </View>

              <View style={styles.detailRow}>
                <Typography variant="caption" color="secondary" style={{ letterSpacing: 1 }}>
                  PAYMENT METHOD
                </Typography>
                <Typography variant="body" weight="medium" style={{ color: theme.colors.text.primary }}>
                  {order.paymentMethod}
                </Typography>
              </View>

              <View style={styles.detailRow}>
                <Typography variant="caption" color="secondary" style={{ letterSpacing: 1 }}>
                  ESTIMATED ARRIVAL
                </Typography>
                <Typography variant="body" weight="medium" style={{ color: theme.colors.text.primary }}>
                  3-5 Business Days
                </Typography>
              </View>

              <View style={styles.divider} />

              {/* Items List */}
              <Typography variant="caption" color="secondary" style={{ letterSpacing: 1.5, marginBottom: 12, fontFamily: 'Inter_600SemiBold', fontSize: 10 }}>
                ITEMS IN THIS ORDER ({order.items.length})
              </Typography>

              {order.items.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  <Image source={{ uri: item.imageUrl || 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=200' }} style={styles.itemThumb} contentFit="cover" />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Typography variant="caption" color="secondary" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 10 }}>
                      {item.brand.toUpperCase()}
                    </Typography>
                    <Typography variant="body" weight="medium" numberOfLines={1} style={{ color: theme.colors.text.primary }}>
                      {item.name}
                    </Typography>
                    <Typography variant="caption" color="secondary" style={{ marginTop: 2 }}>
                      {item.type === 'tester' ? 'Mini / Tester' : 'Full Size'} • Qty {item.quantity}
                    </Typography>
                  </View>
                  <Typography variant="price" weight="bold" style={{ color: theme.colors.text.primary, fontSize: 16 }}>
                    ₹{item.price * item.quantity}
                  </Typography>
                </View>
              ))}

              <View style={styles.divider} />

              {/* Total Row */}
              <View style={styles.totalRow}>
                <Typography variant="h2" weight="medium" style={{ color: theme.colors.text.primary }}>
                  Amount Paid
                </Typography>
                <Typography variant="price" weight="bold" style={styles.totalAmount}>
                  ₹{order.total}
                </Typography>
              </View>
            </View>
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
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
    marginBottom: 16,
    position: 'relative',
  },
  glowCircle: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
  },
  headerBlock: {
    alignItems: 'center',
    marginBottom: 20,
  },
  confirmedBadge: {
    color: '#B8860B',
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 6,
  },
  titleText: {
    color: theme.colors.text.primary,
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitleText: {
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  cashbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    padding: 16,
    marginBottom: 20,
    width: '100%',
  },
  detailsCard: {
    width: '100%',
    padding: 20,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    marginVertical: 14,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F5F5F3',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalAmount: {
    color: theme.colors.text.primary,
    fontSize: 26,
  },
  addressBox: {
    flexDirection: 'row',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
  },
  actionsContainer: {
    width: '100%',
    marginTop: 8,
  },
});
