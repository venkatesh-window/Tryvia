import { useRouter } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { LandingVideo } from '../src/components/LandingVideo';

export default function LandingScreen() {
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
    backgroundColor: '#000',
  },
});
