import '@/tasks/geofence-task';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View, useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme, Slot, ThemeProvider, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { useAuthStore } from '@/store/authStore';
import { Colors } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;
  const colors = Colors[colorScheme === 'unspecified' || !colorScheme ? 'light' : colorScheme];

  const user = useAuthStore((state) => state.user);
  const initialized = useAuthStore((state) => state.initialized);
  const initAuthListener = useAuthStore((state) => state.initAuthListener);

  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = initAuthListener();
    return () => {
      unsubscribe();
    };
  }, [initAuthListener]);

  useEffect(() => {
    if (!initialized) return;

    SplashScreen.hideAsync();

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
    } else if (user && inAuthGroup) {
      router.replace('/(app)/(tabs)');
    }
  }, [user, initialized, segments, router]);

  if (!initialized) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.text} />
      </View>
    );
  }

  return (
    <ThemeProvider value={theme}>
      <Slot />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
