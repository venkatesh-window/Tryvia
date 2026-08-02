import React from 'react';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { StyleSheet, View } from 'react-native';
import { Home, ShoppingBag, Gift, Award, User } from 'lucide-react-native';
import { theme } from '../../src/theme/theme';
import { MotiView } from 'moti';

// Custom Tab Bar Icon wrapper for premium animations
const TabIcon = ({ focused, IconComponent }: { focused: boolean, IconComponent: any }) => {
  return (
    <MotiView
      animate={{
        scale: focused ? 1.15 : 1,
        translateY: focused ? -4 : 0,
      }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 15,
      }}
      style={styles.iconContainer}
    >
      {/* Active Glow Backdrop */}
      {focused && (
        <MotiView
          from={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          style={styles.activeGlow}
        />
      )}
      <IconComponent 
        size={24} 
        color={focused ? theme.colors.primary.main : theme.colors.text.secondary} 
        strokeWidth={focused ? 2 : 1.5}
      />
      
      {/* Subtle indicator dot */}
      {focused && (
        <MotiView
          from={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 100, type: 'spring', stiffness: 400, damping: 15 }}
          style={styles.indicatorDot}
        />
      )}
    </MotiView>
  );
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 64,
          elevation: 0,
          borderTopWidth: 0,
          backgroundColor: 'transparent',
        },
        tabBarBackground: () => (
          <View style={styles.tabBarBackgroundContainer}>
            <BlurView  tint="light" intensity={60} style={StyleSheet.absoluteFill as any} />
            <View style={styles.tabBarGlassBorder} />
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} IconComponent={Home} />,
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} IconComponent={ShoppingBag} />,
        }}
      />
      <Tabs.Screen
        name="testers"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} IconComponent={Gift} />,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} IconComponent={User} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarBackgroundContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.4)', // Frost
    shadowColor: theme.colors.shadow.glass,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 15,
  },
  tabBarGlassBorder: {
    ...(StyleSheet.absoluteFill as any),
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
  },
  activeGlow: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  indicatorDot: {
    position: 'absolute',
    bottom: -6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.text.primary,
  }
});
