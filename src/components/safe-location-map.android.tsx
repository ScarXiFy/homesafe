import { StyleSheet, View } from 'react-native';
import { Map, Camera, Marker } from '@maplibre/maplibre-react-native';

export interface SafeLocationMapProps {
  latitude: number;
  longitude: number;
  style: any;
}

export function SafeLocationMap({ latitude, longitude, style }: SafeLocationMapProps) {
  return (
    <Map
      style={style}
      mapStyle="https://tiles.openfreemap.org/styles/liberty"
      dragPan={false}
      touchZoom={false}
      doubleTapZoom={false}
      doubleTapHoldZoom={false}
      touchRotate={false}
      touchPitch={false}
      attribution={false}
      logo={false}
    >
      <Camera
        initialViewState={{
          center: [longitude, latitude],
          zoom: 15,
        }}
      />
      <Marker lngLat={[longitude, latitude]}>
        <View style={styles.mapPin} />
      </Marker>
    </Map>
  );
}

const styles = StyleSheet.create({
  mapPin: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#208AEF',
    borderColor: '#FFFFFF',
    borderWidth: 3,
  },
});
