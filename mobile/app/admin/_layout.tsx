import { Stack } from 'expo-router';
import { useAuthStore } from '../../src/store/useAuthStore';
import { Redirect } from 'expo-router';

export default function AdminLayout() {
  const { isAuthenticated, user, isHydrated } = useAuthStore();

  if (!isHydrated) {
    return null; // or loading spinner
  }

  if (!isAuthenticated || (user?.role !== 'ADMIN' && !user?.isSuperuser)) {
    return <Redirect href="/" />;
  }

  return (
    <Stack>
      <Stack.Screen name="vendors/index" options={{ title: 'Vendor Management', headerBackTitle: 'Admin' }} />
      <Stack.Screen name="vendors/[id]" options={{ title: 'Vendor Details', headerBackTitle: 'Vendors' }} />
    </Stack>
  );
}
