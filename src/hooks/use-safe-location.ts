import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot,
  serverTimestamp,
} from '@react-native-firebase/firestore';
import { useAuthStore } from '@/store/authStore';
import { isHomeGeofenceRegistered, registerHomeGeofence } from '@/tasks/geofence-task';

export interface SafeLocation {
  latitude: number;
  longitude: number;
  savedAt?: any;
}

export interface UseSafeLocationResult {
  safeLocation: SafeLocation | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  saveCurrentLocation: () => Promise<void>;
  clearError: () => void;
}

export function useSafeLocation(): UseSafeLocationResult {
  const user = useAuthStore((state) => state.user);
  const [safeLocation, setSafeLocation] = useState<SafeLocation | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const startupGeofenceChecked = useRef<boolean>(false);

  // Case 2: On app startup, check if safeLocation exists in Firestore and no geofence is currently active
  const checkStartupGeofence = useCallback(async (loc: SafeLocation) => {
    if (startupGeofenceChecked.current) return;
    startupGeofenceChecked.current = true;

    try {
      const isAlreadyActive = await isHomeGeofenceRegistered();
      if (!isAlreadyActive) {
        const bgPerm = await Location.getBackgroundPermissionsAsync();
        if (bgPerm.granted) {
          await registerHomeGeofence({
            latitude: loc.latitude,
            longitude: loc.longitude,
          });
        }
      }
    } catch (err) {
      console.error('Failed to check or register startup geofence:', err);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setSafeLocation(null);
      setIsLoading(false);
      startupGeofenceChecked.current = false;
      return;
    }

    setIsLoading(true);
    const db = getFirestore();
    const userDocRef = doc(db, 'users', user.uid);

    const unsubscribe = onSnapshot(
      userDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data && data.safeLocation) {
            const loc = data.safeLocation as SafeLocation;
            setSafeLocation(loc);
            checkStartupGeofence(loc);
          } else {
            setSafeLocation(null);
          }
        } else {
          setSafeLocation(null);
        }
        setIsLoading(false);
      },
      (err) => {
        console.error('Error fetching safe location:', err);
        setError('Failed to load safe location.');
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, checkStartupGeofence]);

  // Case 1: Once, right after user explicitly saves or updates location
  const saveCurrentLocation = useCallback(async (): Promise<void> => {
    if (!user) {
      setError('User is not authenticated.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const newSafeLocation: SafeLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      const db = getFirestore();
      const userDocRef = doc(db, 'users', user.uid);

      await setDoc(
        userDocRef,
        {
          safeLocation: {
            ...newSafeLocation,
            savedAt: serverTimestamp(),
          },
        },
        { merge: true }
      );

      setSafeLocation(newSafeLocation);

      const bgPerm = await Location.getBackgroundPermissionsAsync();
      if (bgPerm.granted) {
        await registerHomeGeofence({
          latitude: newSafeLocation.latitude,
          longitude: newSafeLocation.longitude,
        });
      }
    } catch (err: any) {
      console.error('Error saving current location:', err);
      setError(err.message || 'Failed to save current location. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [user]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    safeLocation,
    isLoading,
    isSaving,
    error,
    saveCurrentLocation,
    clearError,
  };
}
