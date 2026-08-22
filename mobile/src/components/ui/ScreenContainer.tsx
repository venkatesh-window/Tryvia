import React from 'react';
import { View, StyleSheet, StatusBar, Platform } from 'react-native';
import { theme } from '../../theme/theme';

interface ScreenContainerProps {
  children: React.ReactNode;
  showOrbs?: boolean;
}

export function ScreenContainer({ children }: ScreenContainerProps) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <View style={styles.contentLayer}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  contentLayer: {
    flex: 1,
  },
});


