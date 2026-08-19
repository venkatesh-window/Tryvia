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
import { PremiumButton } from '../ui/PremiumButton';
import { useOrderStore, OrderStatus } from '../../store/useOrderStore';
import { useCartStore } from '../../store/useCartStore';
import { Image } from 'expo-image';
import {
  X,
  Package,
  CheckCircle2,
  RotateCcw,
  Sparkles,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { theme } from '../../theme/theme';

interface OrdersModalProps {
  visible: boolean;
  onClose: () => void;
}

const STATUS_STEPS: OrderStatus[] = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED'];

export const OrdersModal: React.FC<OrdersModalProps> = ({ visible, onClose }) => {
  const { orders, fetchOrders } = useOrderStore();
  const { addItem } = useCartStore();

  React.useEffect(() => {
    if (visible) {
      fetchOrders();
    }
  }, [visible]);

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
      case 'DELIVERED':
        return '#16A34A';
      case 'SHIPPED':
        return '#2563EB';
      case 'PAID':
        return '#D97706';
      default:
        return '#B8860B';
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        >
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill as any} />
        </TouchableOpacity>

        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Typography variant="caption" weight="bold" style={styles.subHeader}>
                PURCHASE HISTORY
              </Typography>
              <Typography variant="h2" weight="medium" style={styles.title}>
                My Orders
              </Typography>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={18} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {orders.length === 0 ? (
              <View style={styles.emptyState}>
                <Package size={52} color="#AAAAAA" strokeWidth={1.2} />
                <Typography variant="h3" weight="medium" style={{ color: theme.colors.text.primary, marginTop: 16, marginBottom: 6 }}>
                  No Orders Yet
                </Typography>
                <Typography variant="body" color="secondary" align="center" style={{ marginBottom: 24, paddingHorizontal: 20 }}>
                  Your luxury order journey begins here. Explore discovery testers and flagship formulations.
                </Typography>
                <PremiumButton title="Explore Collection" onPress={onClose} variant="primary" />
              </View>
            ) : (
              orders.map((order) => {
                const currentStepIdx = STATUS_STEPS.indexOf(order.status);

                return (
                  <View key={order.id} style={styles.orderCard}>
                    {/* Top Row: Order ID & Status */}
                    <View style={styles.orderHeaderRow}>
                      <View>
                        <Typography variant="caption" weight="bold" style={{ color: theme.colors.text.primary, letterSpacing: 1, fontSize: 13 }}>
                          #{order.orderNumber}
                        </Typography>
                        <Typography variant="caption" color="secondary" style={{ marginTop: 2 }}>
                          {order.date} • {order.paymentMethod}
                        </Typography>
                      </View>

                      <View style={[styles.statusBadge, { borderColor: getStatusColor(order.status) + '33', backgroundColor: getStatusColor(order.status) + '15' }]}>
                        <Typography
                          variant="caption"
                          weight="bold"
                          style={{ color: getStatusColor(order.status), fontSize: 10, letterSpacing: 0.5 }}
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
                                  <CheckCircle2 size={12} color="#FFFFFF" />
                                ) : (
                                  <View style={styles.stepPointInactive} />
                                )}
                              </View>
                              <Typography
                                variant="caption"
                                style={[
                                  styles.stepLabel,
                                  isCompleted && { color: theme.colors.text.primary, fontFamily: 'Inter_600SemiBold' },
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
                        <Typography variant="price" weight="bold" style={{ color: theme.colors.text.primary, fontSize: 15 }}>
                          ₹{item.price * item.quantity}
                        </Typography>
                      </View>
                    ))}

                    <View style={styles.cardDivider} />

                    {/* Footer Row */}
                    <View style={styles.orderFooterRow}>
                      <View>
                        <Typography variant="caption" color="secondary" style={{ letterSpacing: 1, fontFamily: 'Inter_600SemiBold', fontSize: 10 }}>
                          TOTAL PAID
                        </Typography>
                        <Typography variant="price" weight="bold" style={{ color: theme.colors.text.primary, fontSize: 20 }}>
                          ₹{order.total}
                        </Typography>
                      </View>

                      <TouchableOpacity
                        style={styles.reorderBtn}
                        onPress={() => handleReorder(order)}
                        activeOpacity={0.8}
                      >
                        <RotateCcw size={13} color="#FFFFFF" />
                        <Typography variant="caption" weight="medium" style={{ color: '#FFFFFF', marginLeft: 6 }}>
                          Order Again
                        </Typography>
                      </TouchableOpacity>
                    </View>
                  </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 32 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
  },
  subHeader: {
    color: '#B8860B',
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: 2,
  },
  title: {
    color: theme.colors.text.primary,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  orderCard: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: '#FAFAF8',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    marginBottom: 16,
  },
  orderHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  stepPointWrapper: {
    alignItems: 'center',
  },
  stepPoint: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepPointActive: {
    backgroundColor: '#121212',
  },
  stepPointCurrent: {
    borderWidth: 2,
    borderColor: '#B8860B',
  },
  stepPointInactive: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  stepLabel: {
    fontSize: 10,
    color: '#888888',
    marginTop: 4,
  },
  stepConnector: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    marginHorizontal: 4,
    marginBottom: 16,
  },
  stepConnectorActive: {
    backgroundColor: '#121212',
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    marginVertical: 14,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F5F5F3',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
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
    backgroundColor: '#121212',
    borderRadius: 12,
  },
});
