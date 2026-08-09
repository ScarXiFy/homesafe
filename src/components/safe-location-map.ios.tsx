import MapView, { Marker } from 'react-native-maps';

export interface SafeLocationMapProps {
  latitude: number;
  longitude: number;
  style: any;
}

export function SafeLocationMap({ latitude, longitude, style }: SafeLocationMapProps) {
  return (
    <MapView
      style={style}
      region={{
        latitude,
        longitude,
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
          latitude,
          longitude,
        }}
        title="Safe Location"
      />
    </MapView>
  );
}
