import React from "react";
import { View, StyleSheet, StatusBar } from "react-native";
import { theme } from "../../theme/theme";

export function ScreenContainer({ children }) {
  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      <View style={styles.contentLayer}>{children}</View>
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
