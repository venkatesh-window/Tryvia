import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Text } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../../src/store/useAuthStore';
import { Typography } from '../../src/components/ui/Typography';
import { LayoutDashboard, Package, ShoppingBag, Store, Settings, LogOut, User } from 'lucide-react-native';

export default function VendorLayout() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // In a real implementation, we would check if the user is a vendor
  // For Phase 1, we just ensure they are logged in or redirect to /vendor/login
  useEffect(() => {
    if (!isAuthenticated && segments[1] !== 'login') {
      router.replace('/vendor/login');
    }
  }, [isAuthenticated, segments]);

  if (!isAuthenticated && segments[1] !== 'login') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#CB6D73" />
      </View>
    );
  }

  // If on login page, don't show the sidebar layout
  if (segments[1] === 'login') {
    return <Stack screenOptions={{ headerShown: false }} />;
  }

  const navigateTo = (path: string) => {
    router.push(path as any);
  };

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/vendor/dashboard' },
    { name: 'Products', icon: Package, path: '/vendor/products' },
    { name: 'Orders', icon: ShoppingBag, path: '/vendor/orders' },
    { name: 'Store Profile', icon: Store, path: '/vendor/store' },
  ];

  const currentRoute = `/vendor/${segments[1]}`;

  return (
    <View style={styles.container}>
      {/* Sidebar for Desktop / Tablet */}
      <View style={styles.sidebar}>
        <View style={styles.sidebarHeader}>
          <Typography style={styles.brandTitle}>TryVia</Typography>
          <Typography style={styles.brandSubtitle}>VENDOR PORTAL</Typography>
        </View>

        <View style={styles.navMenu}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentRoute === item.path;
            return (
              <TouchableOpacity
                key={item.name}
                style={[styles.navItem, isActive && styles.navItemActive]}
                onPress={() => navigateTo(item.path)}
              >
                <Icon size={20} color={isActive ? '#CB6D73' : '#8E8A85'} />
                <Typography style={[styles.navText, isActive && styles.navTextActive]}>
                  {item.name}
                </Typography>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.sidebarFooter}>
          <TouchableOpacity style={styles.navItem}>
            <Settings size={20} color="#8E8A85" />
            <Typography style={styles.navText}>Settings</Typography>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => {
            // implement logout in Phase 2
            router.replace('/');
          }}>
            <LogOut size={20} color="#8E8A85" />
            <Typography style={styles.navText}>Logout</Typography>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Area */}
      <View style={styles.mainContent}>
        <Stack screenOptions={{ headerShown: false }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FAF8F5',
  },
  sidebar: {
    width: 260,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#ECE7E1',
    display: 'flex',
    flexDirection: 'column',
  },
  sidebarHeader: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#ECE7E1',
  },
  brandTitle: {
    fontFamily: 'CormorantGaramond_700Bold',
    fontSize: 28,
    color: '#1A1918',
    letterSpacing: 1,
  },
  brandSubtitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    color: '#CB6D73',
    letterSpacing: 2,
    marginTop: 4,
  },
  navMenu: {
    flex: 1,
    padding: 16,
    gap: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 12,
  },
  navItemActive: {
    backgroundColor: '#FCEEF0',
  },
  navText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#8E8A85',
  },
  navTextActive: {
    fontFamily: 'Inter_600SemiBold',
    color: '#1A1918',
  },
  sidebarFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#ECE7E1',
    gap: 8,
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
});
