import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { Typography } from '../../src/components/ui/Typography';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useRouter } from 'expo-router';
import { 
  Bell, 
  Settings, 
  Package, 
  Heart, 
  CreditCard, 
  ChevronRight, 
  LogOut,
  Sparkles,
  Crown
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { OrdersModal } from '../../src/components/profile/OrdersModal';
import { WishlistModal } from '../../src/components/profile/WishlistModal';
import { PaymentMethodsModal } from '../../src/components/profile/PaymentMethodsModal';
import { AccountSettingsModal } from '../../src/components/profile/AccountSettingsModal';
import { WalletModal } from '../../src/components/profile/WalletModal';

const MENU_ITEMS = [
  { key: 'orders', icon: Package, label: 'My Orders' },
  { key: 'wishlist', icon: Heart, label: 'Wishlist' },
  { key: 'payments', icon: CreditCard, label: 'Payment Methods' },
  { key: 'settings', icon: Settings, label: 'Account Settings' },
] as const;

type ProfileModalKey = typeof MENU_ITEMS[number]['key'] | 'wallet';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeModal, setActiveModal] = useState<ProfileModalKey | null>(null);

  const handleLogout = async () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await logout();
  };

  const handleMenuPress = (key: ProfileModalKey) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActiveModal(key);
  };

  const userName = user?.fullName || 'Tester User';
  const userEmail = user?.email || 'test@tryvia.com';
  const userInitial = userName.charAt(0).toUpperCase() || 'T';
  const walletBalance = user?.walletBalance || 350;
  const starsCount = user?.tryviaStars || 0;

  return (
    <ScreenContainer>
      {/* Top Header */}
      <View style={[styles.headerContainer, { paddingTop: insets.top > 0 ? insets.top + 6 : 16 }]}>
        <View style={styles.headerRow}>
          <View>
            <Typography style={styles.headerTitle}>Profile</Typography>
            <View style={styles.titleUnderline} />
          </View>

          {/* Right Action Icons: Notifications Bell & Settings */}
          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={styles.iconBtn}
              activeOpacity={0.7}
              onPress={() => handleMenuPress('settings')}
            >
              <Bell size={22} color="#1A1918" strokeWidth={1.75} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconBtn}
              activeOpacity={0.7}
              onPress={() => handleMenuPress('settings')}
            >
              <Settings size={22} color="#1A1918" strokeWidth={1.75} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 110 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* User Identity & Stats Card */}
        <Animated.View entering={FadeInUp.duration(550).delay(100)} style={styles.profileCard}>
          {/* Top User Info Section */}
          <View style={styles.userTopSection}>
            {/* Pink Initial Avatar */}
            <View style={styles.avatarCircle}>
              <Typography style={styles.avatarText}>{userInitial}</Typography>
            </View>

            {/* Name & Email */}
            <View style={styles.userInfo}>
              <Typography style={styles.userName}>{userName}</Typography>
              <Typography style={styles.userEmail}>{userEmail}</Typography>
            </View>
          </View>

          {/* Bottom 3-Column Stats Row */}
          <View style={styles.statsRow}>
            {/* Membership */}
            <View style={styles.statColumn}>
              <Typography style={styles.statLabel}>MEMBERSHIP</Typography>
              <View style={styles.membershipValueRow}>
                <Typography style={styles.membershipText}>TRYVIA BLACK</Typography>
                <View style={styles.crownBadge}>
                  <Crown size={11} color="#CB6D73" strokeWidth={2} />
                </View>
              </View>
            </View>

            <View style={styles.statDivider} />

            {/* Stars */}
            <View style={styles.statColumn}>
              <Typography style={styles.statLabel}>STARS</Typography>
              <View style={styles.starsValueRow}>
                <Sparkles size={14} color="#CB6D73" strokeWidth={2} />
                <Typography style={styles.statValue}> {starsCount}</Typography>
              </View>
            </View>

            <View style={styles.statDivider} />

            {/* Wallet */}
            <TouchableOpacity
              style={styles.statColumn}
              activeOpacity={0.7}
              onPress={() => handleMenuPress('wallet')}
            >
              <Typography style={styles.statLabel}>WALLET</Typography>
              <Typography style={styles.statValue}>₹{walletBalance}</Typography>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Menu Items Card */}
        <Animated.View entering={FadeInUp.duration(550).delay(220)} style={styles.menuCard}>
          {MENU_ITEMS.map((item, index) => {
            const IconComponent = item.icon;
            const isLast = index === MENU_ITEMS.length - 1;

            return (
              <React.Fragment key={item.key}>
                <TouchableOpacity
                  style={styles.menuRow}
                  activeOpacity={0.7}
                  onPress={() => handleMenuPress(item.key)}
                >
                  <View style={styles.menuIconContainer}>
                    <IconComponent size={20} color="#CB6D73" strokeWidth={1.75} />
                  </View>

                  <Typography style={styles.menuTitle}>{item.label}</Typography>

                  <ChevronRight size={18} color="#8E8A85" strokeWidth={1.75} />
                </TouchableOpacity>

                {!isLast && <View style={styles.menuDivider} />}
              </React.Fragment>
            );
          })}
        </Animated.View>

        {/* Log Out Pill Button */}
        <Animated.View entering={FadeInUp.duration(500).delay(320)}>
          <TouchableOpacity
            style={styles.logoutButton}
            activeOpacity={0.8}
            onPress={handleLogout}
          >
            <LogOut size={18} color="#CB6D73" strokeWidth={1.75} />
            <Typography style={styles.logoutText}>Log Out</Typography>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* Profile Feature Modals */}
      <OrdersModal
        visible={activeModal === 'orders'}
        onClose={() => setActiveModal(null)}
      />

      <WishlistModal
        visible={activeModal === 'wishlist'}
        onClose={() => setActiveModal(null)}
      />

      <PaymentMethodsModal
        visible={activeModal === 'payments'}
        onClose={() => setActiveModal(null)}
      />

      <AccountSettingsModal
        visible={activeModal === 'settings'}
        onClose={() => setActiveModal(null)}
      />

      <WalletModal
        visible={activeModal === 'wallet'}
        onClose={() => setActiveModal(null)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#FAF8F5',
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontFamily: 'CormorantGaramond_700Bold',
    fontSize: 32,
    color: '#1A1918',
    letterSpacing: 0.2,
  },
  titleUnderline: {
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#CB6D73',
    marginTop: 4,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBtn: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ECE7E1',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  userTopSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FDF7F7',
  },
  avatarCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#CB6D73',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#CB6D73',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarText: {
    fontFamily: 'CormorantGaramond_700Bold',
    fontSize: 28,
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1918',
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 13,
    color: '#8E8A85',
    fontFamily: 'Inter_400Regular',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 18,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F5ECEC',
  },
  statColumn: {
    flex: 1,
    alignItems: 'flex-start',
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#F0ECE6',
    marginHorizontal: 8,
  },
  statLabel: {
    fontSize: 10,
    color: '#CB6D73',
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  membershipValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  membershipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1918',
    fontFamily: 'Inter_700Bold',
  },
  crownBadge: {
    backgroundColor: '#FDF0F1',
    padding: 3,
    borderRadius: 6,
  },
  starsValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1918',
    fontFamily: 'Inter_700Bold',
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#ECE7E1',
    paddingVertical: 4,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFF5F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1918',
    fontFamily: 'Inter_600SemiBold',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F7F4F0',
    marginLeft: 72,
    marginRight: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#F2CDD1',
    gap: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#CB6D73',
    fontFamily: 'Inter_600SemiBold',
  },
});
