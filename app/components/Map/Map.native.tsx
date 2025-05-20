// MapNative.tsx
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';
import { Station } from './Map.types';

interface MapProps {
  stations: Station[];
  userLocation: { latitude: number; longitude: number };
  selectedFuelType: string;
  onMarkerPress: (station: Station | null) => void;
  searchRadius: number;
  mapRef: React.RefObject<any>;
}

const MapNative: React.FC<MapProps> = (props) => {
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);

  const handleMarkerPress = (station: Station) => {
    setSelectedStationId(station.idDgeg.toString());
    props.onMarkerPress(station);
  };

  const handleMapPress = () => {
    setSelectedStationId(null);
    props.onMarkerPress(null);
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={props.mapRef}
        style={styles.map}
        initialRegion={{
          latitude: props.userLocation.latitude,
          longitude: props.userLocation.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        showsUserLocation
        showsMyLocationButton
        showsCompass
        showsScale
        onPress={handleMapPress}
      >
        {/* User Location Marker */}
        <Marker
          coordinate={{
            latitude: props.userLocation.latitude,
            longitude: props.userLocation.longitude,
          }}
          pinColor="blue"
          title="Você está aqui"
        />

        {/* Station Markers */}
        {props.stations.map((station) => {
          const [lng, lat] = station.localizacao.coordinates;
          const fuelInfo = station.combustiveis.find(f => f.tipo === props.selectedFuelType);
          return (
            <Marker
              key={station.idDgeg}
              coordinate={{
                latitude: lat,
                longitude: lng,
              }}
              pinColor={selectedStationId === station.idDgeg.toString() ? "red" : "green"}
              onPress={() => handleMarkerPress(station)}
              title={station.nome}
              description={fuelInfo ? `${props.selectedFuelType}: ${fuelInfo.preco.toFixed(3)}€` : ''}
            />
          );
        })}

        {/* Search Radius Circle */}
        <Circle
          center={{
            latitude: props.userLocation.latitude,
            longitude: props.userLocation.longitude,
          }}
          radius={props.searchRadius * 1000}
          strokeColor="rgba(59, 130, 246, 0.5)"
          fillColor="rgba(59, 130, 246, 0.1)"
          strokeWidth={2}
        />
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});

export default MapNative;
