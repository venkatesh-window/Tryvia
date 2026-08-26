import { Stack } from 'expo-router';
import { useAuthStore } from '../../src/store/useAuthStore';
import { Redirect } from 'expo-router';

export default function AdminLayout() {
  const { user, isAuthenticated } = useAuthStore();
  const isHydrated = true; // Wait for persist to hydrate if applicable

  if (!isHydrated) {
    return null; // or loading spinner
  }

  if (!isAuthenticated || !user || !(user as any).is_superuser) {
    return <Redirect href="/" />;
  }

  return (
    <Stack>
      <Stack.Screen name="vendors/index" options={{ title: 'Vendor Management', headerBackTitle: 'Admin' }} />
      <Stack.Screen name="vendors/[id]" options={{ title: 'Vendor Details', headerBackTitle: 'Vendors' }} />
    </Stack>
  );
}
