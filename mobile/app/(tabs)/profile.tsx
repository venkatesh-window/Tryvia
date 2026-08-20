import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { Typography } from '../../src/components/ui/Typography';
import { PremiumButton } from '../../src/components/ui/PremiumButton';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { Settings, Package, Heart, CreditCard, LogOut, ChevronRight, Sparkles } from 'lucide-react-native';
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
      <Animated.View entering={FadeIn.duration(1000)} style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 16) }]}>
        <View style={styles.headerTopRow}>
           <Typography variant="h2" weight="medium" style={styles.logo}>PROFILE</Typography>
        </View>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* User Identity Card */}
        <Animated.View entering={FadeInUp.duration(1000).delay(200)}>
          <View style={styles.profileCardWrapper}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1618331835717-801e976710b2?q=80&w=800&auto=format&fit=crop' }} 
              style={StyleSheet.absoluteFill as any} 
              contentFit="cover" 
            />
            <BlurView  intensity={90} tint="dark" style={StyleSheet.absoluteFill as any} />
            <View style={styles.profileCardGlassBorder} />
            
            <View style={styles.profileCardContent}>
              <View style={styles.profileHeaderRow}>
                <View style={styles.avatarContainer}>
                  <BlurView  intensity={50} tint="light" style={styles.avatarBlur}>
                    <Typography variant="h2" style={{ color: '#000', fontFamily: 'CormorantGaramond_700Bold' }}>
                      {user?.fullName?.charAt(0) || 'U'}
                    </Typography>
                  </BlurView>
                </View>
                
                <View style={styles.profileInfo}>
                  <Typography variant="h2" weight="medium" style={{ color: '#fff', marginBottom: 4 }}>
                    {user?.fullName || 'Luxury Member'}
                  </Typography>
                  <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.7)', letterSpacing: 1 }}>
                    {user?.email || 'member@tryvia.com'}
                  </Typography>
                </View>
              </View>

              <View style={styles.profileCardDivider} />
              
              <View style={styles.profileFooterRow}>
                <View style={{ flexShrink: 1, marginRight: 10 }}>
                  <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.6)', letterSpacing: 1, marginBottom: 4 }}>MEMBERSHIP</Typography>
                  <View style={[styles.vipTag, { height: 32, justifyContent: 'center', alignSelf: 'flex-start' }]}>
                     <Typography variant="caption" weight="bold" style={{ color: '#000', letterSpacing: 1 }} numberOfLines={1}>TRYVIA BLACK</Typography>
                  </View>
                </View>
                
                <View style={{ flexShrink: 1, marginRight: 10, alignItems: 'center' }}>
                  <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.6)', letterSpacing: 1, marginBottom: 4 }}>STARS</Typography>
                  <View style={{ height: 32, justifyContent: 'center', flexDirection: 'row', alignItems: 'center' }}>
                     <Sparkles size={14} color="#D4AF37" style={{ marginRight: 4 }} />
                     <Typography variant="price" style={{ color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 18 }} numberOfLines={1}>{user?.tryviaStars || 0}</Typography>
                  </View>
                </View>

                <TouchableOpacity activeOpacity={0.7} onPress={() => handleMenuPress('wallet')} style={{ alignItems: 'flex-end', flexShrink: 1 }}>
                  <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.6)', letterSpacing: 1, marginBottom: 4, textAlign: 'right' }}>WALLET BALANCE</Typography>
                  <View style={{ height: 32, justifyContent: 'center' }}>
                    <Typography variant="price" style={{ color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 24, lineHeight: 28 }} numberOfLines={1}>₹{user?.walletBalance || 0}</Typography>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Menu Items */}
        <Animated.View entering={FadeInUp.duration(1000).delay(400)} style={styles.menuContainer}>
          {MENU_ITEMS.map((item, index) => (
            <TouchableOpacity
              key={item.key}
              activeOpacity={0.7}
              onPress={() => handleMenuPress(item.key)}
            >
              <GlassCard intensity={25} style={styles.menuItemCard}>
                <View style={styles.menuItemRow}>
                  <View style={styles.menuIconWrapper}>
                    <item.icon size={20} color={theme.colors.text.primary} strokeWidth={1.5} />
                  </View>
                  <Typography variant="body" weight="medium" style={styles.menuLabel}>
                    {item.label}
                  </Typography>
                  <ChevronRight size={20} color={theme.colors.text.secondary} />
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

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* 4 Interactive Modals */}
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
    paddingBottom: 16,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  logo: {
    letterSpacing: 4,
    color: theme.colors.text.primary,
  },
  scrollContent: {
    paddingTop: 16,
    paddingHorizontal: 24,
  },
  profileCardWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  profileCardGlassBorder: {
    ...(StyleSheet.absoluteFill as any),
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  profileCardContent: {
    padding: 24,
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    marginRight: 20,
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
    marginBottom: 24,
  },
  profileFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  vipTag: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  menuContainer: {
    marginBottom: 40,
    gap: 16,
  },
  menuItemCard: {
    padding: 8,
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  menuIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuLabel: {
    flex: 1,
    letterSpacing: 0.5,
  },
  logoutWrapper: {
    marginTop: 24,
  },
  bottomPadding: {
    height: 140, // Accounts for floating tab bar
  }
});
