import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="safe-location" />
      <Stack.Screen name="family-link" />
    </Stack>
  );
}
