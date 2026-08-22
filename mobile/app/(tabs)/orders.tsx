import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { Typography } from '../../src/components/ui/Typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Package, Lock } from 'lucide-react-native';
import { Image } from 'expo-image';
import Animated, { FadeInUp } from 'react-native-reanimated';

const ORDERS_DATA = [
  {
    id: 'ORD-8921',
    time: 'Today, 2:45 PM',
    status: 'In Transit',
    statusType: 'transit',
    totalPaid: 1300,
    walletLocked: 1170,
    items: [
      {
        name: 'Midnight Recovery Cloud Cream',
        type: '(Tester)',
        image: require('../../assets/cat_skincare.jpg'),
      },
      {
        name: 'Coco Noir Parfum',
        type: '(Tester)',
        image: require('../../assets/cat_fragrance.jpg'),
      },
    ],
  },
  {
    id: 'ORD-7740',
    time: 'Yesterday',
    status: 'Delivered',
    statusType: 'delivered',
    totalPaid: 3420,
    walletLocked: 0,
    items: [
      {
        name: 'Dior Addict Lip Glow',
        type: '(Full Size)',
        image: require('../../assets/cat_makeup.jpg'),
      },
    ],
  },
];

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <ScreenContainer>
      <View style={[styles.container, { paddingTop: insets.top > 0 ? insets.top + 6 : 16 }]}>
        {/* Top Header Row with Icon */}
        <View style={styles.headerRow}>
          <View>
            <Typography style={styles.title}>My Orders</Typography>
            <View style={styles.titleUnderline} />
          </View>

          <View style={styles.headerIconCircle}>
            <Package size={22} color="#1A1918" strokeWidth={1.5} />
          </View>
        </View>

        <Typography style={styles.subtitle}>
          Track your tester shipments & smart upgrades
        </Typography>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {ORDERS_DATA.map((order, orderIdx) => {
            const isDelivered = order.statusType === 'delivered';

            return (
              <Animated.View
                key={order.id}
                entering={FadeInUp.duration(500).delay(orderIdx * 100)}
                style={styles.orderCard}
              >
                {/* Order Top Bar: Icon, ID, Timestamp & Status Pill */}
                <View style={styles.orderHeader}>
                  <View style={styles.orderIdentityRow}>
                    <View style={[styles.orderIconBadge, isDelivered && styles.deliveredIconBadge]}>
                      <Package size={20} color="#1A1918" strokeWidth={1.5} />
                    </View>

                    <View style={styles.orderIdentityText}>
                      <Typography style={styles.orderId}>{order.id}</Typography>
                      <Typography style={styles.orderTime}>{order.time}</Typography>
                    </View>
                  </View>

                  {/* Status Badge */}
                  <View style={[styles.statusBadge, isDelivered ? styles.deliveredBadge : styles.transitBadge]}>
                    <Typography style={[styles.statusText, isDelivered ? styles.deliveredText : styles.transitText]}>
                      {order.status}
                    </Typography>
                  </View>
                </View>

                {/* Items List */}
                <View style={styles.itemsContainer}>
                  {order.items.map((item, idx) => (
                    <View key={idx} style={styles.itemRow}>
                      <View style={styles.itemImageWrapper}>
                        <Image
                          source={item.image}
                          style={styles.itemImage}
                          contentFit="cover"
                        />
                      </View>

                      <View style={styles.itemDetails}>
                        <View style={styles.itemDotAndTitle}>
                          <View style={[styles.dot, isDelivered ? styles.deliveredDot : styles.transitDot]} />
                          <Typography style={styles.itemName}>{item.name}</Typography>
                        </View>
                        <Typography style={styles.itemType}>{item.type}</Typography>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Order Bottom Section: Total & Wallet Locked Pill */}
                <View style={styles.cardFooter}>
                  <View>
                    <Typography style={styles.totalLabel}>TOTAL PAID</Typography>
                    <Typography style={styles.totalAmount}>₹{order.totalPaid}</Typography>
                  </View>

                  {order.walletLocked > 0 && (
                    <View style={styles.lockedPill}>
                      <Lock size={12} color="#CB6D73" strokeWidth={2} />
                      <Typography style={styles.lockedPillText}>
                        +₹{order.walletLocked} Wallet Locked
                      </Typography>
                    </View>
                  )}
                </View>
              </Animated.View>
            );
          })}
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: '#FAF8F5',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: 'CormorantGaramond_700Bold',
    fontSize: 34,
    color: '#1A1918',
    letterSpacing: 0.2,
  },
  titleUnderline: {
    width: 32,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#CB6D73',
    marginTop: 6,
  },
  headerIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FAF0F1',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F8D8DC',
  },
  subtitle: {
    fontSize: 13.5,
    color: '#8E8A85',
    fontFamily: 'Inter_400Regular',
    marginTop: 10,
    marginBottom: 20,
  },
  scrollContent: {
    paddingBottom: 110,
    gap: 18,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#ECE7E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  orderIdentityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  orderIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FAF0F1',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F8D8DC',
  },
  deliveredIconBadge: {
    backgroundColor: '#EBF7EE',
    borderColor: '#D4EDDA',
  },
  orderIdentityText: {
    justifyContent: 'center',
  },
  orderId: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: '#1A1918',
  },
  orderTime: {
    fontSize: 12.5,
    color: '#8E8A85',
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  transitBadge: {
    backgroundColor: '#FDF0F1',
  },
  deliveredBadge: {
    backgroundColor: '#EBF7EE',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  transitText: {
    color: '#CB6D73',
  },
  deliveredText: {
    color: '#2E7D32',
  },
  itemsContainer: {
    gap: 14,
    marginBottom: 18,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemImageWrapper: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: '#F5F2EC',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ECE7E1',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemDetails: {
    flex: 1,
    marginLeft: 14,
  },
  itemDotAndTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  transitDot: {
    backgroundColor: '#CB6D73',
  },
  deliveredDot: {
    backgroundColor: '#4CAF50',
  },
  itemName: {
    fontFamily: 'CormorantGaramond_700Bold',
    fontSize: 16,
    color: '#1A1918',
    lineHeight: 20,
  },
  itemType: {
    fontSize: 12.5,
    color: '#8E8A85',
    fontFamily: 'Inter_400Regular',
    marginLeft: 12,
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F7F4F0',
  },
  totalLabel: {
    fontSize: 10,
    color: '#8E8A85',
    letterSpacing: 1,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    marginBottom: 2,
  },
  totalAmount: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: '#1A1918',
  },
  lockedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFF8F8',
    borderWidth: 1,
    borderColor: '#F8D8DC',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
  },
  lockedPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CB6D73',
    fontFamily: 'Inter_600SemiBold',
  },
});
