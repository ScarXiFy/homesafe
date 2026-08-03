import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot,
  serverTimestamp,
} from '@react-native-firebase/firestore';
import { useAuthStore } from '@/store/authStore';

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

  useEffect(() => {
    if (!user) {
      setSafeLocation(null);
      setIsLoading(false);
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
            setSafeLocation(data.safeLocation as SafeLocation);
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
  }, [user]);

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
