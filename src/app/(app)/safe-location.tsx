import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSafeLocation } from '@/hooks/use-safe-location';

export default function SafeLocationScreen() {
  const router = useRouter();
  const theme = useTheme();

  const {
    safeLocation,
    isLoading,
    isSaving,
    error,
    saveCurrentLocation,
  } = useSafeLocation();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}
            onPress={() => router.back()}
          >
            <ThemedText type="smallBold" style={{ color: '#3c87f7' }}>
              ← Back
            </ThemedText>
          </Pressable>
          <ThemedText type="subtitle" style={styles.title}>
            Safe Location
          </ThemedText>
        </View>

        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.text} />
            <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.two }}>
              Loading safe location...
            </ThemedText>
          </View>
        ) : (
          <View style={styles.content}>
            {error ? (
              <View style={[styles.errorBox, { backgroundColor: '#FFD2D2' }]}>
                <ThemedText style={{ color: '#D8000C', fontSize: 14 }}>
                  {error}
                </ThemedText>
              </View>
            ) : null}

            {safeLocation ? (
              <View style={styles.mapContainer}>
                <ThemedText type="smallBold" style={styles.sectionHeader}>
                  Saved Safe Location
                </ThemedText>

                <View style={[styles.mapWrapper, { borderColor: theme.backgroundSelected }]}>
                  <MapView
                    style={styles.map}
                    region={{
                      latitude: safeLocation.latitude,
                      longitude: safeLocation.longitude,
                      latitudeDelta: 0.005,
                      longitudeDelta: 0.005,
                    }}
                    scrollEnabled={false}
                    zoomEnabled={false}
                    rotateEnabled={false}
                    pitchEnabled={false}
                  >
                    <Marker
                      coordinate={{
                        latitude: safeLocation.latitude,
                        longitude: safeLocation.longitude,
                      }}
                      title="Safe Location"
                    />
                  </MapView>
                </View>

                <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: 'center' }}>
                  Lat: {safeLocation.latitude.toFixed(5)}, Long: {safeLocation.longitude.toFixed(5)}
                </ThemedText>

                <Pressable
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    { backgroundColor: theme.backgroundElement },
                    pressed && !isSaving && { opacity: 0.7 },
                  ]}
                  onPress={saveCurrentLocation}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator color={theme.text} size="small" />
                  ) : (
                    <ThemedText type="smallBold" style={{ color: theme.text }}>
                      Update Location to Current Position
                    </ThemedText>
                  )}
                </Pressable>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <ThemedText type="default" style={{ textAlign: 'center', color: theme.textSecondary }}>
                  No safe location has been saved yet. Save your current location to enable automatic arrival detection.
                </ThemedText>

                <Pressable
                  style={({ pressed }) => [
                    styles.primaryButton,
                    { backgroundColor: isSaving ? theme.backgroundSelected : theme.text },
                    pressed && !isSaving && { opacity: 0.8 },
                  ]}
                  onPress={saveCurrentLocation}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator color={theme.background} />
                  ) : (
                    <ThemedText type="default" style={{ color: theme.background, fontWeight: '600' }}>
                      Use My Current Location as Home
                    </ThemedText>
                  )}
                </Pressable>
              </View>
            )}
          </View>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
    paddingBottom: BottomTabInset + Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.three,
  },
  backButton: {
    paddingRight: Spacing.three,
    paddingVertical: Spacing.one,
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    gap: Spacing.four,
  },
  errorBox: {
    padding: Spacing.two,
    borderRadius: Spacing.one,
  },
  mapContainer: {
    gap: Spacing.three,
  },
  sectionHeader: {
    fontSize: 16,
  },
  mapWrapper: {
    height: 220,
    width: '100%',
    borderRadius: Spacing.three,
    overflow: 'hidden',
    borderWidth: 1,
  },
  map: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.four,
    paddingHorizontal: Spacing.two,
  },
  primaryButton: {
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
    marginTop: Spacing.two,
  },
});
