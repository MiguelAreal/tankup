import React, { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Callout, Circle, Marker } from 'react-native-maps';
import { MapProps, Posto } from '../../../types/models';
import PostoCard from '../PostoCard';

const Map = forwardRef<MapView, MapProps>((props, ref) => {
  const internalMapRef = useRef<MapView>(null);
  const mapRef = (ref || internalMapRef) as React.RefObject<MapView>;
  const [isMapReady, setIsMapReady] = useState(false);

  // Debug stations data
  useEffect(() => {
    console.log('Stations received:', props.stations);
    if (props.stations.length > 0) {
      console.log('First station coordinates:', props.stations[0].localizacao.coordinates);
    }
  }, [props.stations]);

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
    props.onMarkerPress(station);
    // Animate to the selected station
    if (mapRef.current && station) {
      const [lng, lat] = station.localizacao.coordinates;
      mapRef.current.animateToRegion({
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);

      // Scroll to the station in the list if the callback is provided
      if (props.onStationListScroll) {
        props.onStationListScroll(station);
      }
    }
  }, [props.onMarkerPress, props.onStationListScroll]);

  const handleMapPress = useCallback(() => {
    props.onMarkerPress(null);
  }, [props.onMarkerPress]);

  const initialRegion = useMemo(() => {
    console.log('Setting initial region with user location:', props.userLocation);
    const region = {
      latitude: props.userLocation.latitude,
      longitude: props.userLocation.longitude,
      latitudeDelta: 0.0422,
      longitudeDelta: 0.0221,
    };
    console.log('Calculated initial region:', region);
    return region;
  }, [props.userLocation.latitude, props.userLocation.longitude]);

  // Only show user location marker if not using showsUserLocation
  const userLocationMarker = null;

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

  const stationMarkers = useMemo(() => {
    console.log('Rendering markers, isMapReady:', isMapReady);
    return props.stations.map((station) => {
      const [lng, lat] = station.localizacao.coordinates;
      const isSelected = props.selectedStation?.id === station.id;
      console.log('Creating marker for station:', {
        id: station.id,
        coordinates: [lng, lat],
        latitude: lat,
        longitude: lng,
        isMapReady: isMapReady
      });
      return (
        <Marker
          key={station.id}
          coordinate={{
            latitude: lat,
            longitude: lng,
          }}
          onPress={() => handleMarkerPress(station)}
        >
          <View style={styles.markerContainer}>
            <View style={[styles.markerIcon, isSelected && styles.selectedMarkerIcon]}>
              <View style={styles.markerDot} />
            </View>
          </View>
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
    });
  }, [props.stations, props.selectedFuelType, props.selectedStation, handleMarkerPress, props.userLocation, isMapReady]);

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
        onMapReady={() => {
          console.log('Map is ready, setting isMapReady to true');
          setIsMapReady(true);
        }}
      >
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
  },
  markerContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  markerIcon: {
    width: 24,
    height: 24,
    backgroundColor: 'rgb(0, 163, 82)',
    borderWidth: 3,
    borderColor: '#fff',
    borderRadius: 12,
    transform: [{ rotate: '-45deg' }],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  selectedMarkerIcon: {
    backgroundColor: 'rgb(239, 68, 68)',
  },
  markerDot: {
    width: 8,
    height: 8,
    backgroundColor: '#fff',
    borderRadius: 4,
    opacity: 0.8,
    transform: [{ rotate: '45deg' }],
  },
});

Map.displayName = 'Map';

export default Map; 