// MapNative.tsx
import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';
import { MapProps, Posto } from '../../../types/models';

const MapNative: React.FC<MapProps> = (props) => {
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);

  const handleMarkerPress = useCallback((station: Posto) => {
    setSelectedStationId(station.id.toString());
    props.onMarkerPress(station);
  }, [props.onMarkerPress]);

  const handleMapPress = useCallback(() => {
    setSelectedStationId(null);
    props.onMarkerPress(null);
  }, [props.onMarkerPress]);

  const initialRegion = useMemo(() => ({
    latitude: props.userLocation.latitude,
    longitude: props.userLocation.longitude,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  }), [props.userLocation.latitude, props.userLocation.longitude]);

  const userLocationMarker = useMemo(() => (
    <Marker
      coordinate={{
        latitude: props.userLocation.latitude,
        longitude: props.userLocation.longitude,
      }}
      pinColor="blue"
      title="Você está aqui"
    />
  ), [props.userLocation.latitude, props.userLocation.longitude]);

  const searchRadiusCircle = useMemo(() => (
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
  ), [props.userLocation.latitude, props.userLocation.longitude, props.searchRadius]);

  const stationMarkers = useMemo(() => (
    props.stations.map((station) => {
      const [lng, lat] = station.localizacao.coordinates;
      const fuelInfo = station.combustiveis.find((f: { tipo: string; preco: number }) => f.tipo === props.selectedFuelType);
      return (
        <Marker
          key={station.id}
          coordinate={{
            latitude: lat,
            longitude: lng,
          }}
          pinColor={selectedStationId === station.id.toString() ? "red" : "green"}
          onPress={() => handleMarkerPress(station)}
          title={station.nome}
          description={fuelInfo ? `${props.selectedFuelType}: ${fuelInfo.preco.toFixed(3)}€` : ''}
        />
      );
    })
  ), [props.stations, props.selectedFuelType, selectedStationId, handleMarkerPress]);

  return (
    <View style={styles.container}>
      <MapView
        ref={props.mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton
        scrollEnabled={props.allowInteraction !== false}
        zoomEnabled={props.allowInteraction !== false}
        rotateEnabled={props.allowInteraction !== false}
        onPress={handleMapPress}
        moveOnMarkerPress={false}
      >
        {userLocationMarker}
        {stationMarkers}
        {searchRadiusCircle}
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

export default React.memo(MapNative);

