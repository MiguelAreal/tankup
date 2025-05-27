import React, { forwardRef, useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Callout, Circle, Marker } from 'react-native-maps';
import { MapProps, Posto } from '../../../types/models';
import PostoCard from '../PostoCard';

const Map = forwardRef<MapView, MapProps>((props, ref) => {
  const [selectedStationId, setSelectedStationId] = React.useState<string | null>(null);
  const internalMapRef = useRef<MapView>(null);
  const mapRef = (ref || internalMapRef) as React.RefObject<MapView>;

  // Update map position when userLocation changes
  useEffect(() => {
    if (mapRef.current && props.userLocation) {
      mapRef.current.animateToRegion({
        latitude: props.userLocation.latitude,
        longitude: props.userLocation.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }, 1000);
    }
  }, [props.userLocation]);

  const handleMarkerPress = useCallback((station: Posto) => {
    setSelectedStationId(station.id.toString());
    props.onMarkerPress(station);

    // Animate to the selected station
    if (mapRef.current) {
      const [lng, lat] = station.localizacao.coordinates;
      mapRef.current.animateToRegion({
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
    }
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
    props.searchRadius ? (
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
    ) : null
  ), [props.userLocation.latitude, props.userLocation.longitude, props.searchRadius]);

  const stationMarkers = useMemo(() => (
    props.stations.map((station) => {
      const [lng, lat] = station.localizacao.coordinates;
      const isSelected = selectedStationId === station.id.toString();
      
      return (
        <Marker
          key={station.id}
          coordinate={{
            latitude: lat,
            longitude: lng,
          }}
          pinColor={isSelected ? "red" : "green"}
          onPress={() => handleMarkerPress(station)}
        >
          <Callout tooltip>
            <View style={styles.calloutContainer}>
              <PostoCard
                station={station}
                userLocation={props.userLocation}
                selectedFuelType={props.selectedFuelType}
                isSelected={isSelected}
              />
            </View>
          </Callout>
        </Marker>
      );
    })
  ), [props.stations, props.selectedFuelType, selectedStationId, handleMarkerPress, props.userLocation]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton
        showsCompass
        showsScale
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
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  calloutContainer: {
    width: 300,
    backgroundColor: 'transparent',
  }
});

Map.displayName = 'Map';

export default Map; 