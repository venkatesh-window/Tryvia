import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { Typography } from '../../src/components/ui/Typography';
import { PremiumButton } from '../../src/components/ui/PremiumButton';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { Settings, Package, Heart, CreditCard, LogOut, ChevronRight } from 'lucide-react-native';
import { theme } from '../../src/theme/theme';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';

const MENU_ITEMS = [
  { icon: Package, label: 'My Orders' },
  { icon: Heart, label: 'Wishlist' },
  { icon: CreditCard, label: 'Payment Methods' },
  { icon: Settings, label: 'Account Settings' },
];

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleLogout = async () => {
    await logout();
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
                <View>
                  <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.6)', letterSpacing: 2, marginBottom: 4 }}>MEMBERSHIP</Typography>
                  <View style={[styles.vipTag, { height: 32, justifyContent: 'center' }]}>
                     <Typography variant="caption" weight="bold" style={{ color: '#000', letterSpacing: 1 }}>TRYVIA BLACK</Typography>
                  </View>
                </View>
                
                <View style={{ alignItems: 'flex-end' }}>
                  <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.6)', letterSpacing: 2, marginBottom: 4 }}>WALLET BALANCE</Typography>
                  <View style={{ height: 32, justifyContent: 'center' }}>
                    <Typography variant="h3" style={{ color: '#fff', fontFamily: 'CormorantGaramond_700Bold', fontSize: 24, lineHeight: 28 }}>₹{user?.walletBalance || 0}</Typography>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Menu Items */}
        <Animated.View entering={FadeInUp.duration(1000).delay(400)} style={styles.menuContainer}>
          {MENU_ITEMS.map((item, index) => (
            <GlassCard key={index} intensity={25} style={styles.menuItemCard}>
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
