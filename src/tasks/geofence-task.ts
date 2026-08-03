import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';

export const GEOFENCE_TASK_NAME = 'HOME_SAFE_GEOFENCE_TASK';
export const GEOFENCE_RADIUS_METERS = 100;

interface GeofenceTaskData {
  eventType: Location.GeofencingEventType;
  region: Location.LocationRegion;
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
