import { useCallback, useEffect, useState } from 'react';
import { Linking } from 'react-native';
import * as Location from 'expo-location';

export type LocationPermissionStatus =
  | 'undetermined'
  | 'granted-always'
  | 'granted-foreground-only'
  | 'denied';

export interface UseLocationPermissionResult {
  status: LocationPermissionStatus;
  isLoading: boolean;
  requestPermissions: () => Promise<LocationPermissionStatus>;
  checkPermissions: () => Promise<LocationPermissionStatus>;
  openSettings: () => Promise<void>;
}

export function useLocationPermission(): UseLocationPermissionResult {
  const [status, setStatus] = useState<LocationPermissionStatus>('undetermined');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkPermissions = useCallback(async (): Promise<LocationPermissionStatus> => {
    setIsLoading(true);
    try {
      const fgStatus = await Location.getForegroundPermissionsAsync();
      if (!fgStatus.granted) {
        const currentStatus: LocationPermissionStatus =
          fgStatus.status === 'undetermined' && fgStatus.canAskAgain
            ? 'undetermined'
            : 'denied';
        setStatus(currentStatus);
        setIsLoading(false);
        return currentStatus;
      }

      const bgStatus = await Location.getBackgroundPermissionsAsync();
      const currentStatus: LocationPermissionStatus = bgStatus.granted
        ? 'granted-always'
        : 'granted-foreground-only';

      setStatus(currentStatus);
      setIsLoading(false);
      return currentStatus;
    } catch (error) {
      console.error('Error checking location permissions:', error);
      setStatus('denied');
      setIsLoading(false);
      return 'denied';
    }
  }, []);

  const requestPermissions = useCallback(async (): Promise<LocationPermissionStatus> => {
    setIsLoading(true);
    try {
      const fgResult = await Location.requestForegroundPermissionsAsync();
      if (!fgResult.granted) {
        setStatus('denied');
        setIsLoading(false);
        return 'denied';
      }

      const bgResult = await Location.requestBackgroundPermissionsAsync();
      const finalStatus: LocationPermissionStatus = bgResult.granted
        ? 'granted-always'
        : 'granted-foreground-only';

      setStatus(finalStatus);
      setIsLoading(false);
      return finalStatus;
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      setStatus('denied');
      setIsLoading(false);
      return 'denied';
    }
  }, []);

  const openSettings = useCallback(async (): Promise<void> => {
    try {
      await Linking.openSettings();
    } catch (error) {
      console.error('Error opening settings:', error);
    }
  }, []);

  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  return {
    status,
    isLoading,
    requestPermissions,
    checkPermissions,
    openSettings,
  };
}
