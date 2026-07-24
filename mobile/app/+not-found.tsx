import { Link, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { ScreenContainer } from '../src/components/ui/ScreenContainer';
import { Typography } from '../src/components/ui/Typography';
import { PremiumButton } from '../src/components/ui/PremiumButton';
import { useTheme } from '../src/hooks/useTheme';

export default function NotFoundScreen() {
  const theme = useTheme();

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <ScreenContainer showOrbs={true}>
        <View style={styles.container}>
          <Typography variant="h1" style={styles.title}>404</Typography>
          <Typography variant="body" color="secondary" align="center" style={styles.subtitle}>
            Looks like you wandered out of the beauty aisle. This page doesn't exist.
          </Typography>
          
          <Link href={"/(tabs)/" as any} asChild>
            <PremiumButton title="Go back home" onPress={() => {}} style={styles.link} />
          </Link>
        </View>
      </ScreenContainer>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 64,
    marginBottom: 16,
  },
  subtitle: {
    marginBottom: 32,
    maxWidth: '80%',
  },
  link: {
    minWidth: 200,
  },
});
