import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { Typography } from '../../src/components/ui/Typography';
import { PremiumButton } from '../../src/components/ui/PremiumButton';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { Settings, Package, Heart, CreditCard, ChevronRight, Sparkles } from 'lucide-react-native';
import { theme } from '../../src/theme/theme';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';

import { OrdersModal } from '../../src/components/profile/OrdersModal';
import { WishlistModal } from '../../src/components/profile/WishlistModal';
import { PaymentMethodsModal } from '../../src/components/profile/PaymentMethodsModal';
import { AccountSettingsModal } from '../../src/components/profile/AccountSettingsModal';
import { WalletModal } from '../../src/components/profile/WalletModal';
import * as Haptics from 'expo-haptics';
import { TouchableOpacity, Platform } from 'react-native';
import { useResponsive } from '../../src/hooks/useResponsive';

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
  const { width, safeTopPadding, bottomTabBarPadding, isSmallDevice } = useResponsive();

  const [activeModal, setActiveModal] = useState<ProfileModalKey | null>(null);

  const handleLogout = async () => {
    await logout();
  };

  const handleMenuPress = (key: ProfileModalKey) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActiveModal(key);
  };

  return (
    <ScreenContainer showOrbs={true}>
      
      {/* Floating Header */}
      <Animated.View entering={FadeIn.duration(1000)} style={[styles.headerContainer, { paddingTop: safeTopPadding }]}>
        <View style={styles.headerTopRow}>
           <Typography variant="h2" weight="medium" style={styles.logo}>PROFILE</Typography>
        </View>
      </Animated.View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomTabBarPadding }]} showsVerticalScrollIndicator={false}>
        
        {/* User Identity Card */}
        <Animated.View entering={FadeInUp.duration(1000).delay(200)}>
          <View style={styles.profileCardWrapper}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1618331835717-801e976710b2?q=80&w=800&auto=format&fit=crop' }} 
              style={StyleSheet.absoluteFill as any} 
              contentFit="cover" 
            />
            <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill as any} />
            <View style={styles.profileCardGlassBorder} />
            
            <View style={[styles.profileCardContent, isSmallDevice && { padding: 16 }]}>
              <View style={styles.profileHeaderRow}>
                <View style={styles.avatarContainer}>
                  <BlurView intensity={50} tint="light" style={styles.avatarBlur}>
                    <Typography variant="h2" style={{ color: '#000', fontFamily: 'CormorantGaramond_700Bold' }}>
                      {user?.fullName?.charAt(0) || 'U'}
                    </Typography>
                  </BlurView>
                </View>
                
                <View style={styles.profileInfo}>
                  <Typography variant="h2" weight="medium" numberOfLines={1} style={{ color: '#fff', marginBottom: 2 }}>
                    {user?.fullName || 'Luxury Member'}
                  </Typography>
                  <Typography variant="caption" numberOfLines={1} style={{ color: 'rgba(255,255,255,0.7)', letterSpacing: 0.5 }}>
                    {user?.email || 'member@tryvia.com'}
                  </Typography>
                </View>
              </View>

              <View style={styles.profileCardDivider} />
              
              <View style={styles.profileFooterRow}>
                <View style={styles.footerCol}>
                  <Typography variant="caption" style={styles.footerColLabel}>MEMBERSHIP</Typography>
                  <View style={styles.vipTag}>
                     <Typography variant="caption" weight="bold" style={{ color: '#000', fontSize: 10, letterSpacing: 0.5 }} numberOfLines={1}>TRYVIA BLACK</Typography>
                  </View>
                </View>
                
                <View style={[styles.footerCol, { alignItems: 'center' }]}>
                  <Typography variant="caption" style={styles.footerColLabel}>STARS</Typography>
                  <View style={{ height: 28, justifyContent: 'center', flexDirection: 'row', alignItems: 'center' }}>
                     <Sparkles size={13} color="#D4AF37" style={{ marginRight: 4 }} />
                     <Typography variant="price" style={{ color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 16 }} numberOfLines={1}>{user?.tryviaStars || 0}</Typography>
                  </View>
                </View>

                <TouchableOpacity activeOpacity={0.7} onPress={() => handleMenuPress('wallet')} style={[styles.footerCol, { alignItems: 'flex-end' }]}>
                  <Typography variant="caption" style={[styles.footerColLabel, { textAlign: 'right' }]}>WALLET</Typography>
                  <View style={{ height: 28, justifyContent: 'center' }}>
                    <Typography variant="price" style={{ color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 18 }} numberOfLines={1}>₹{user?.walletBalance || 0}</Typography>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Menu Items */}
        <Animated.View entering={FadeInUp.duration(1000).delay(400)} style={styles.menuContainer}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.key}
              activeOpacity={0.7}
              onPress={() => handleMenuPress(item.key)}
            >
              <GlassCard intensity={25} style={styles.menuItemCard}>
                <View style={styles.menuItemRow}>
                  <View style={styles.menuIconWrapper}>
                    <item.icon size={18} color={theme.colors.text.primary} strokeWidth={1.5} />
                  </View>
                  <Typography variant="body" weight="medium" style={styles.menuLabel}>
                    {item.label}
                  </Typography>
                  <ChevronRight size={18} color={theme.colors.text.secondary} />
                </View>
              </GlassCard>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Logout Button */}
        <Animated.View entering={FadeInUp.duration(1000).delay(600)} style={styles.logoutWrapper}>
          <PremiumButton 
            title="Log Out" 
            variant="glass" 
            onPress={handleLogout} 
          />
        </Animated.View>
      </ScrollView>

      {/* Modals */}
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
    paddingBottom: 12,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  logo: {
    letterSpacing: 3,
    color: theme.colors.text.primary,
    fontSize: 22,
  },
  scrollContent: {
    paddingTop: 12,
    paddingHorizontal: 20,
  },
  profileCardWrapper: {
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  profileCardGlassBorder: {
    ...(StyleSheet.absoluteFill as any),
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  profileCardContent: {
    padding: 20,
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    marginRight: 16,
  },
  avatarBlur: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  profileInfo: {
    flex: 1,
  },
  profileCardDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginBottom: 16,
  },
  profileFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerCol: {
    flex: 1,
  },
  footerColLabel: {
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.5,
    marginBottom: 4,
    fontSize: 9,
  },
  vipTag: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  menuContainer: {
    marginBottom: 28,
    gap: 12,
  },
  menuItemCard: {
    padding: 4,
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    minHeight: 48,
  },
  menuIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuLabel: {
    flex: 1,
    letterSpacing: 0.5,
    fontSize: 14,
  },
  logoutWrapper: {
    marginTop: 8,
  },
});

