import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { LandingVideo } from '../src/components/LandingVideo';

export default function Index() {
  const router = useRouter();

  const handleFinished = () => {
    router.replace('/(tabs)' as any);
  };

  return (
    <View style={styles.container}>
      <LandingVideo onFinished={handleFinished} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
