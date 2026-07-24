import React from 'react';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { StyleSheet, View } from 'react-native';
import { Typography } from '../../src/components/ui/Typography';
import { Home, ShoppingBag, Gift, Star, User } from 'lucide-react-native';
import { theme } from '../../src/theme/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 32,
          left: 24,
          right: 24,
          height: 72,
          borderRadius: 36,
          backgroundColor: 'transparent',
          borderWidth: 0,
          elevation: 0, // Remove android default shadow
          shadowColor: 'transparent', // We handle shadow in the background component
        },
        tabBarBackground: () => (
          <View style={styles.tabBarBackgroundContainer}>
            <BlurView tint="light" intensity={60} style={StyleSheet.absoluteFill as any} />
            <View style={styles.tabBarGlassBorder} />
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
               <Home size={24} color={focused ? theme.colors.text.primary : theme.colors.text.secondary} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
               <ShoppingBag size={24} color={focused ? theme.colors.text.primary : theme.colors.text.secondary} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="testers"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
               <Gift size={24} color={focused ? theme.colors.text.primary : theme.colors.text.secondary} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="rewards"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
               <Star size={24} color={focused ? theme.colors.text.primary : theme.colors.text.secondary} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
               <User size={24} color={focused ? theme.colors.text.primary : theme.colors.text.secondary} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarBackgroundContainer: {
    flex: 1,
    borderRadius: 36,
    overflow: 'hidden',
    backgroundColor: theme.colors.background.paper, // 35-50% translucent glass constraint
    shadowColor: '#A596B4', // Soft lavender-grey shadow constraint
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  tabBarGlassBorder: {
    ...(StyleSheet.absoluteFill as any),
    borderRadius: 36,
    borderWidth: 1,
    borderColor: theme.colors.border.glass,
  },
  iconContainer: {
    padding: 12,
    borderRadius: 24,
  },
  iconContainerActive: {
    backgroundColor: 'rgba(242, 211, 216, 0.3)', // Soft blush pink highlight
  }
});
