import { useCallback, useEffect, useState } from 'react';
import { Linking, PermissionsAndroid, Platform } from 'react-native';
import {
  getMessaging,
  requestPermission,
  hasPermission,
  getToken,
  onTokenRefresh,
  registerDeviceForRemoteMessages,
  isDeviceRegisteredForRemoteMessages,
  AuthorizationStatus,
} from '@react-native-firebase/messaging';
import { getFirestore, doc, setDoc } from '@react-native-firebase/firestore';
import { useAuthStore } from '@/store/authStore';

export type NotificationPermissionStatus =
  | 'undetermined'
  | 'granted'
  | 'denied';

export interface UseNotificationPermissionResult {
  status: NotificationPermissionStatus;
  isLoading: boolean;
  fcmToken: string | null;
  errorMessage: string | null;
  requestNotificationPermission: () => Promise<NotificationPermissionStatus>;
  checkNotificationPermission: () => Promise<NotificationPermissionStatus>;
  openSettings: () => Promise<void>;
}

export function useNotificationPermission(): UseNotificationPermissionResult {
  const [status, setStatus] = useState<NotificationPermissionStatus>('undetermined');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const user = useAuthStore((state) => state.user);

  const saveTokenToFirestore = useCallback(async (token: string, uid: string) => {
    try {
      const db = getFirestore();
      await setDoc(
        doc(db, 'users', uid),
        {
          fcmToken: token,
          fcmTokenPlatform: Platform.OS,
        },
        { merge: true }
      );
    } catch (err) {
      console.error('Failed to save FCM token to Firestore:', err);
    }
  }, []);

  const fetchAndSaveFcmToken = useCallback(
    async (messagingInstance: any, uid: string) => {
      try {
        if (!isDeviceRegisteredForRemoteMessages(messagingInstance)) {
          await registerDeviceForRemoteMessages(messagingInstance);
        }
        const token = await getToken(messagingInstance);
        if (token) {
          setFcmToken(token);
          await saveTokenToFirestore(token, uid);
        }
      } catch (tokenErr) {
        console.warn('FCM token registration/retrieval warning:', tokenErr);
      }
    },
    [saveTokenToFirestore]
  );

  const checkNotificationPermission = useCallback(async (): Promise<NotificationPermissionStatus> => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const postNotificationPermission = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS;
        if (postNotificationPermission) {
          const hasAndroidPermission = await PermissionsAndroid.check(postNotificationPermission);
          if (!hasAndroidPermission) {
            setStatus('undetermined');
            setIsLoading(false);
            return 'undetermined';
          }
        }
      }

      const messaging = getMessaging();
      const authStatus = await hasPermission(messaging);
      const isGranted =
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL;

      if (isGranted) {
        setStatus('granted');
        setIsLoading(false);
        return 'granted';
      } else if (authStatus === AuthorizationStatus.DENIED) {
        setStatus('denied');
        setErrorMessage("Notification permission was denied. Arrival notifications won't work without this permission.");
        setIsLoading(false);
        return 'denied';
      } else {
        setStatus('undetermined');
        setIsLoading(false);
        return 'undetermined';
      }
    } catch (err: any) {
      console.error('Error checking notification permission:', err);
      setStatus('denied');
      setErrorMessage('Could not check notification permissions.');
      setIsLoading(false);
      return 'denied';
    }
  }, []);

  const requestNotificationPermission = useCallback(async (): Promise<NotificationPermissionStatus> => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      let androidGranted = true;
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const postNotificationPermission = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS;
        if (postNotificationPermission) {
          const res = await PermissionsAndroid.request(postNotificationPermission);
          androidGranted = res === PermissionsAndroid.RESULTS.GRANTED;
        }
      }

      if (!androidGranted) {
        setStatus('denied');
        setErrorMessage("Notification permission was denied. Arrival notifications won't work without this permission.");
        setIsLoading(false);
        return 'denied';
      }

      const messaging = getMessaging();
      const authStatus = await requestPermission(messaging);
      const isGranted =
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL;

      if (isGranted) {
        setStatus('granted');
        if (user?.uid) {
          await fetchAndSaveFcmToken(messaging, user.uid);
        }
        setIsLoading(false);
        return 'granted';
      } else {
        setStatus('denied');
        setErrorMessage("Notification permission was denied. Arrival notifications won't work without this permission.");
        setIsLoading(false);
        return 'denied';
      }
    } catch (err: any) {
      console.error('Error requesting notification permission:', err);
      setStatus('denied');
      setErrorMessage('An error occurred while requesting notification permissions.');
      setIsLoading(false);
      return 'denied';
    }
  }, [user?.uid, fetchAndSaveFcmToken]);

  const openSettings = useCallback(async (): Promise<void> => {
    try {
      await Linking.openSettings();
    } catch (error) {
      console.error('Error opening settings:', error);
    }
  }, []);

  // Automatic registration and token refresh listener when granted and authenticated
  useEffect(() => {
    if (!user?.uid || status !== 'granted') {
      return;
    }

    const messaging = getMessaging();

    fetchAndSaveFcmToken(messaging, user.uid);

    const unsubscribe = onTokenRefresh(messaging, async (newToken: string) => {
      setFcmToken(newToken);
      if (user?.uid) {
        await saveTokenToFirestore(newToken, user.uid);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [user?.uid, status, fetchAndSaveFcmToken, saveTokenToFirestore]);

  // Initial check on mount
  useEffect(() => {
    checkNotificationPermission().then((initialStatus) => {
      if (initialStatus === 'undetermined' && user?.uid) {
        requestNotificationPermission();
      }
    });
  }, [checkNotificationPermission, requestNotificationPermission, user?.uid]);

  return {
    status,
    isLoading,
    fcmToken,
    errorMessage,
    requestNotificationPermission,
    checkNotificationPermission,
    openSettings,
  };
}
