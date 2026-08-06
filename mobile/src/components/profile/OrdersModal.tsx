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
import { useOrderStore, OrderStatus } from '../../store/useOrderStore';
import { useCartStore } from '../../store/useCartStore';
import { Image } from 'expo-image';
import {
  X,
  Package,
  CheckCircle2,
  Clock,
  Truck,
  RotateCcw,
  Sparkles,
  ChevronRight,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface OrdersModalProps {
  visible: boolean;
  onClose: () => void;
}

const STATUS_STEPS: OrderStatus[] = ['Confirmed', 'Preparing', 'Shipped', 'Delivered'];

export const OrdersModal: React.FC<OrdersModalProps> = ({ visible, onClose }) => {
  const { orders } = useOrderStore();
  const { addItem } = useCartStore();

  const handleReorder = (order: (typeof orders)[0]) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    order.items.forEach((item) => {
      addItem(
        {
          id: Number(item.id.replace(/\D/g, '')) || 1,
          name: item.name,
          full_price: item.type === 'full' ? item.price : item.price * 5,
          tester_price: item.type === 'tester' ? item.price : 350,
          image_url: item.imageUrl,
          brand: { id: 0, name: item.brand },
          category: { id: 0, name: 'Luxury' },
          stock_full: 10,
          stock_tester: 10,
        },
        item.type
      );
    });
    onClose();
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'Delivered':
        return '#4ADE80';
      case 'Shipped':
        return '#60A5FA';
      case 'Preparing':
        return '#FBBF24';
      default:
        return '#D4AF37';
    }
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
                PURCHASE HISTORY
              </Typography>
              <Typography variant="h2" weight="medium" style={{ color: '#fff', marginTop: 2 }}>
                My Orders
              </Typography>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {orders.length === 0 ? (
              <View style={styles.emptyState}>
                <Package size={56} color="rgba(255,255,255,0.3)" strokeWidth={1} />
                <Typography variant="h3" style={{ color: '#fff', marginTop: 16, marginBottom: 8 }}>
                  No Orders Yet
                </Typography>
                <Typography variant="body" color="secondary" align="center" style={{ marginBottom: 24 }}>
                  Your luxury order journey begins here. Explore discovery testers and flagship formulations.
                </Typography>
                <PremiumButton title="Explore Collection" onPress={onClose} variant="primary" />
              </View>
            ) : (
              orders.map((order) => {
                const currentStepIdx = STATUS_STEPS.indexOf(order.status);

                return (
                  <GlassCard key={order.id} intensity={25} style={styles.orderCard}>
                    {/* Top Row: Order ID & Status */}
                    <View style={styles.orderHeaderRow}>
                      <View>
                        <Typography variant="body" weight="bold" style={{ color: '#fff', letterSpacing: 1 }}>
                          #{order.orderNumber}
                        </Typography>
                        <Typography variant="caption" color="secondary" style={{ marginTop: 2 }}>
                          {order.date} • {order.paymentMethod}
                        </Typography>
                      </View>

                      <View style={[styles.statusBadge, { borderColor: getStatusColor(order.status) + '66' }]}>
                        <Typography
                          variant="caption"
                          weight="bold"
                          style={{ color: getStatusColor(order.status), fontSize: 11 }}
                        >
                          {order.status.toUpperCase()}
                        </Typography>
                      </View>
                    </View>

                    {/* Stepper Timeline */}
                    <View style={styles.stepperContainer}>
                      {STATUS_STEPS.map((step, idx) => {
                        const isCompleted = idx <= currentStepIdx;
                        const isCurrent = idx === currentStepIdx;

                        return (
                          <React.Fragment key={step}>
                            <View style={styles.stepPointWrapper}>
                              <View
                                style={[
                                  styles.stepPoint,
                                  isCompleted && styles.stepPointActive,
                                  isCurrent && styles.stepPointCurrent,
                                ]}
                              >
                                {isCompleted ? (
                                  <CheckCircle2 size={12} color="#000" />
                                ) : (
                                  <View style={styles.stepPointInactive} />
                                )}
                              </View>
                              <Typography
                                variant="caption"
                                style={[
                                  styles.stepLabel,
                                  isCompleted && { color: '#fff', fontFamily: 'Inter_600SemiBold' },
                                ]}
                              >
                                {step}
                              </Typography>
                            </View>

                            {idx < STATUS_STEPS.length - 1 && (
                              <View
                                style={[
                                  styles.stepConnector,
                                  idx < currentStepIdx && styles.stepConnectorActive,
                                ]}
                              />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </View>

                    <View style={styles.cardDivider} />

                    {/* Order Items */}
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

                    {/* Cashback earned pill */}
                    {order.cashbackEarned > 0 && (
                      <View style={styles.cashbackPill}>
                        <Sparkles size={14} color="#D4AF37" />
                        <Typography variant="caption" style={{ color: '#D4AF37', marginLeft: 6, fontFamily: 'Inter_600SemiBold' }}>
                          +₹{order.cashbackEarned} Wallet Cashback Credited
                        </Typography>
                      </View>
                    )}

                    <View style={styles.cardDivider} />

                    {/* Footer Row */}
                    <View style={styles.orderFooterRow}>
                      <View>
                        <Typography variant="caption" color="secondary" style={{ letterSpacing: 1 }}>
                          TOTAL PAID
                        </Typography>
                        <Typography variant="h2" style={{ color: '#fff', fontSize: 24 }}>
                          ₹{order.total}
                        </Typography>
                      </View>

                      <TouchableOpacity
                        style={styles.reorderBtn}
                        onPress={() => handleReorder(order)}
                      >
                        <RotateCcw size={14} color="#fff" />
                        <Typography variant="caption" weight="medium" style={{ color: '#fff', marginLeft: 6 }}>
                          Order Again
                        </Typography>
                      </TouchableOpacity>
                    </View>
                  </GlassCard>
                );
              })
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
  orderCard: {
    padding: 18,
    borderRadius: 20,
    marginBottom: 16,
  },
  orderHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  stepPointWrapper: {
    alignItems: 'center',
  },
  stepPoint: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepPointActive: {
    backgroundColor: '#D4AF37',
  },
  stepPointCurrent: {
    borderWidth: 2,
    borderColor: '#fff',
  },
  stepPointInactive: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  stepLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
  stepConnector: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: 4,
    marginBottom: 16,
  },
  stepConnectorActive: {
    backgroundColor: '#D4AF37',
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
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
    borderRadius: 8,
    backgroundColor: '#1A1A1A',
  },
  cashbackPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  orderFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reorderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
});
