import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { Typography } from '../../src/components/ui/Typography';

export default function SearchScreen() {
  return (
    <ScreenContainer>
      <View style={styles.container}>
        <Typography variant="h1">Search</Typography>
        <Typography variant="body" color="secondary">AI Assistant & Global Search</Typography>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
