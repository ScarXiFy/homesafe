import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { AnimatedIcon } from '@/components/animated-icon';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/hooks/use-theme';
import { useLocationPermission } from '@/hooks/use-location-permission';

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const authLoading = useAuthStore((state) => state.isLoading);
  const theme = useTheme();

  const {
    status: permStatus,
    isLoading: permLoading,
    requestPermissions,
    openSettings,
  } = useLocationPermission();

  const renderPermissionStatus = () => {
    switch (permStatus) {
      case 'granted-always':
        return (
          <View style={[styles.statusBox, { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' }]}>
            <ThemedText style={{ color: '#2E7D32', fontWeight: '600' }}>
              Status: Granted (Always Allow)
            </ThemedText>
            <ThemedText type="small" style={{ color: '#2E7D32', marginTop: Spacing.half }}>
              Background location is active for arrival detection.
            </ThemedText>
          </View>
        );
      case 'granted-foreground-only':
        return (
          <View style={[styles.statusBox, { backgroundColor: '#FFF8E1', borderColor: '#FFC107' }]}>
            <ThemedText style={{ color: '#F57F17', fontWeight: '600' }}>
              Status: Foreground Only
            </ThemedText>
            <ThemedText type="small" style={{ color: '#F57F17', marginTop: Spacing.half }}>
              "Always Allow" is required for automatic arrival detection while the app is closed.
            </ThemedText>
          </View>
        );
      case 'denied':
        return (
          <View style={[styles.statusBox, { backgroundColor: '#FFEBEE', borderColor: '#EF5350' }]}>
            <ThemedText style={{ color: '#C62828', fontWeight: '600' }}>
              Status: Permission Denied
            </ThemedText>
            <ThemedText type="small" style={{ color: '#C62828', marginTop: Spacing.half }}>
              Location access was denied. Please enable "Always Allow" in your device settings.
            </ThemedText>
          </View>
        );
      case 'undetermined':
      default:
        return (
          <View style={[styles.statusBox, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
            <ThemedText style={{ color: theme.text, fontWeight: '600' }}>
              Status: Not Requested
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.half }}>
              Location permission is needed to detect when you arrive safely.
            </ThemedText>
          </View>
        );
    }
  };

  const renderPermissionButtons = () => {
    if (permLoading) {
      return <ActivityIndicator color={theme.text} style={{ marginVertical: Spacing.two }} />;
    }

    if (permStatus === 'undetermined') {
      return (
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            { backgroundColor: theme.text },
            pressed && { opacity: 0.8 },
          ]}
          onPress={requestPermissions}
        >
          <ThemedText type="default" style={{ color: theme.background, fontWeight: '600' }}>
            Enable Location Access
          </ThemedText>
        </Pressable>
      );
    }

    if (permStatus === 'granted-foreground-only') {
      return (
        <View style={styles.buttonGroup}>
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              { backgroundColor: theme.text },
              pressed && { opacity: 0.8 },
            ]}
            onPress={requestPermissions}
          >
            <ThemedText type="default" style={{ color: theme.background, fontWeight: '600' }}>
              Upgrade to Always Allow
            </ThemedText>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              { backgroundColor: theme.backgroundElement },
              pressed && { opacity: 0.7 },
            ]}
            onPress={openSettings}
          >
            <ThemedText type="smallBold" style={{ color: theme.text }}>
              Open Device Settings
            </ThemedText>
          </Pressable>
        </View>
      );
    }

    if (permStatus === 'denied') {
      return (
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            { backgroundColor: theme.text },
            pressed && { opacity: 0.8 },
          ]}
          onPress={openSettings}
        >
          <ThemedText type="default" style={{ color: theme.background, fontWeight: '600' }}>
            Open Device Settings
          </ThemedText>
        </Pressable>
      );
    }

    return null;
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.heroSection}>
          <AnimatedIcon />
          <ThemedText type="title" style={styles.title}>
            HomeSafe
          </ThemedText>
          <ThemedText type="default" style={styles.subtitle}>
            Logged in as {user?.email ?? 'User'}
          </ThemedText>

          <View style={styles.permissionCard}>
            <ThemedText type="subtitle" style={styles.cardTitle}>
              Location Permission
            </ThemedText>
            {renderPermissionStatus()}
            {renderPermissionButtons()}
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              { backgroundColor: theme.backgroundElement, marginTop: Spacing.one },
              pressed && { opacity: 0.8 },
            ]}
            onPress={() => router.push('/safe-location')}
          >
            <ThemedText type="default" style={{ color: theme.text, fontWeight: '600' }}>
              Manage Safe Location
            </ThemedText>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.signOutButton,
              { backgroundColor: theme.backgroundElement },
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => signOut()}
            disabled={authLoading}
          >
            <ThemedText type="smallBold" style={{ color: '#FF3B30' }}>
              Sign Out
            </ThemedText>
          </Pressable>
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
    width: '100%',
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  permissionCard: {
    width: '100%',
    marginVertical: Spacing.two,
    gap: Spacing.two,
  },
  cardTitle: {
    fontSize: 20,
    lineHeight: 28,
    textAlign: 'center',
  },
  statusBox: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
  },
  buttonGroup: {
    gap: Spacing.two,
    width: '100%',
  },
  actionButton: {
    height: 48,
    borderRadius: Spacing.two,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  secondaryButton: {
    height: 44,
    borderRadius: Spacing.two,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  signOutButton: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    marginTop: Spacing.two,
  },
});
