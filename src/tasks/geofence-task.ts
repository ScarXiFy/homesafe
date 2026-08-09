import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { getAuth } from '@react-native-firebase/auth';
import { getFirestore, doc, getDoc } from '@react-native-firebase/firestore';

export const GEOFENCE_TASK_NAME = 'HOME_SAFE_GEOFENCE_TASK';
export const GEOFENCE_RADIUS_METERS = 100;

interface GeofenceTaskData {
  eventType: Location.GeofencingEventType;
  region: Location.LocationRegion;
}

async function sendWorkerNotification(
  workerUrl: string,
  authSecret: string,
  payload: { fcmToken: string; title: string; body: string }
) {
  const headers = {
    'Content-Type': 'application/json',
    'X-Homesafe-Auth': authSecret,
  };

  let response: Response | null = null;
  try {
    response = await fetch(workerUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn('[Geofence Push] Worker fetch network error. Retrying once in 2s...', err);
  }

  if (!response || !response.ok) {
    const statusInfo = response ? `Status: ${response.status}` : 'Network error';
    console.warn(`[Geofence Push] Worker request failed (${statusInfo}). Retrying once in 2s...`);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    try {
      response = await fetch(workerUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error('[Geofence Push] Retry fetch network error:', err);
      return;
    }
  }

  if (response && response.ok) {
    console.log('[Geofence Push] Notification sent successfully via Cloudflare Worker.');
  } else if (response) {
    const errorBody = await response.text().catch(() => '');
    console.error(
      `[Geofence Push] Failed to send notification via Worker. Status: ${response.status}. Response: ${
        errorBody || '(empty body)'
      }`
    );
  }
}

async function handleArrivalNotification(locationName?: string): Promise<void> {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser?.uid) {
      console.log('[Geofence Push] No authenticated user found at geofence arrival.');
      return;
    }

    const db = getFirestore();
    const userDocRef = doc(db, 'users', currentUser.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      console.log('[Geofence Push] User document does not exist in Firestore.');
      return;
    }

    const userData = userDocSnap.data();
    const linkedUserId = userData?.linkedUserId;

    if (!linkedUserId) {
      console.log('[Geofence Push] No linked family member found for user.');
      return;
    }

    const linkedUserDocSnap = await getDoc(doc(db, 'users', linkedUserId));

    if (!linkedUserDocSnap.exists()) {
      console.log('[Geofence Push] Linked user document does not exist in Firestore.');
      return;
    }

    const linkedUserData = linkedUserDocSnap.data();
    const fcmToken = linkedUserData?.fcmToken;

    if (!fcmToken) {
      console.log('[Geofence Push] Linked family member does not have an FCM token saved. Notification skipped.');
      return;
    }

    const workerUrl = process.env.EXPO_PUBLIC_WORKER_URL;
    const authSecret = process.env.EXPO_PUBLIC_WORKER_AUTH_SECRET;

    if (!workerUrl || !authSecret || workerUrl.includes('your-worker-url')) {
      console.warn('[Geofence Push] Worker URL or Auth Secret is missing or unconfigured in environment.');
      return;
    }

    const senderName = userData?.email ? userData.email.split('@')[0] : 'Your family member';
    const displayLocation = locationName === 'home' ? 'Home' : locationName;

    const payload = {
      fcmToken,
      title: 'Arrived safely',
      body: `${senderName} has arrived safely at ${displayLocation}!`,
    };

    console.log(`[Geofence Push] Sending push notification to linked user (${linkedUserId})...`);
    await sendWorkerNotification(workerUrl, authSecret, payload);
  } catch (err: any) {
    console.error('[Geofence Push] Unexpected error while processing arrival notification:', err);
  }
}

// Module top-level task definition for background geofencing
TaskManager.defineTask(
  GEOFENCE_TASK_NAME,
  async ({ data, error }: TaskManager.TaskManagerTaskBody<GeofenceTaskData>) => {
    if (error) {
      console.error(`[Geofence Error] Task ${GEOFENCE_TASK_NAME} failed:`, error.message);
      return;
    }

    if (data) {
      const { eventType, region } = data;
      const timestamp = new Date().toISOString();

      if (eventType === Location.GeofencingEventType.Enter) {
        console.log(
          `[Geofence Arrival] Arrived at safe location "${region.identifier}" at ${timestamp}! Region:`,
          region
        );
        await handleArrivalNotification(region.identifier);
      }
    }
  }
);

export async function registerHomeGeofence({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}): Promise<void> {
  const regions: Location.LocationRegion[] = [
    {
      identifier: 'home',
      latitude,
      longitude,
      radius: GEOFENCE_RADIUS_METERS,
      notifyOnEnter: true,
      notifyOnExit: false,
    },
  ];

  await Location.startGeofencingAsync(GEOFENCE_TASK_NAME, regions);
  console.log(
    `[Geofence] Registered home geofence at (${latitude}, ${longitude}) with radius ${GEOFENCE_RADIUS_METERS}m`
  );
}

export async function unregisterHomeGeofence(): Promise<void> {
  const isRegistered = await Location.hasStartedGeofencingAsync(GEOFENCE_TASK_NAME);
  if (isRegistered) {
    await Location.stopGeofencingAsync(GEOFENCE_TASK_NAME);
    console.log(`[Geofence] Unregistered home geofence task`);
  }
}

export async function isHomeGeofenceRegistered(): Promise<boolean> {
  try {
    return await Location.hasStartedGeofencingAsync(GEOFENCE_TASK_NAME);
  } catch (error) {
    console.error('[Geofence] Error checking geofence registration:', error);
    return false;
  }
}
