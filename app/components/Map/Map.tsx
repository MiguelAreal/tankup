import React, { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Callout, Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Posto } from '../../../types/models/Posto';
import { useAppContext } from '../../context/AppContext';
import PostoCard from '../PostoCard';
import { MapProps } from './Map.types';

const Map = forwardRef<any, MapProps>(({
  stations,
  selectedStation,
  onMarkerPress,
  userLocation,
  isSearchActive,
  searchRadius = 0,
  selectedFuelType,
  style,
  onMapReady,
  preferredNavigationApp
}, ref) => {
  const { theme } = useAppContext();
  const mapRef = useRef<any>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  
  // Update map position when userLocation changes
  useEffect(() => {
    if (mapRef.current && userLocation && !isSearchActive) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }, 1000);
    }
  }, [userLocation, isSearchActive]);

  const handleMarkerPress = useCallback((station: Posto) => {
    onMarkerPress(station);
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
      if (onMarkerPress) {
        onMarkerPress(station);
      }
    }
  }, [onMarkerPress]);

  const handleMapPress = useCallback(() => {
    onMarkerPress(null);
  }, [onMarkerPress]);

  const initialRegion = useMemo(() => {
    //console.log('Setting initial region with user location:', userLocation);
    const region = {
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      latitudeDelta: 0.0422,
      longitudeDelta: 0.0221,
    };
    //console.log('Calculated initial region:', region);
    return region;
  }, [userLocation.latitude, userLocation.longitude]);

  // Only show user location marker if not using showsUserLocation
  const userLocationMarker = null;

  const searchRadiusCircle = useMemo(() => (
    !isSearchActive && searchRadius ? (
      <Circle
        center={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
        }}
        radius={searchRadius * 1000}
        strokeColor={theme.primary}
        strokeWidth={2}
        fillColor={`${theme.primary}20`}
      />
    ) : null
  ), [userLocation.latitude, userLocation.longitude, searchRadius, isSearchActive, theme.primary]);

  const stationMarkers = useMemo(() => {
    //console.log('Rendering markers, isMapReady:', isMapReady);
    return stations.map((station) => {
      const [lng, lat] = station.localizacao.coordinates;
      const isSelected = selectedStation?.id === station.id;
      /*console.log('Creating marker for station:', {
        id: station.id,
        coordinates: [lng, lat],
        latitude: lat,
        longitude: lng,
        isMapReady: isMapReady
      });*/
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
                userLocation={userLocation}
                selectedFuelType={selectedFuelType}
                isSelected={isSelected}
                preferredNavigationApp={preferredNavigationApp}
              />
            </View>
          </Callout>
        </Marker>
      );
    });
  }, [stations, selectedFuelType, selectedStation, handleMarkerPress, userLocation, isMapReady]);

  // Handle map ready
  const handleMapReady = useCallback(() => {
    console.log('Map component ready');
    setIsMapReady(true);
    if (onMapReady) {
      onMapReady();
    }
  }, [onMapReady]);

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        showsUserLocation={!isSearchActive}
        showsMyLocationButton={!isSearchActive}
        showsCompass
        showsScale
        scrollEnabled={true}
        zoomEnabled={true}
        rotateEnabled={true}
        onPress={handleMapPress}
        moveOnMarkerPress={false}
        onMapReady={handleMapReady}
        loadingEnabled={true}
        loadingIndicatorColor={theme.primary}
        loadingBackgroundColor={theme.background}
      >
        {stationMarkers}
        {!isSearchActive && (
          <Circle
            center={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            }}
            radius={searchRadius * 1000}
            strokeColor={theme.primary}
            strokeWidth={2}
            fillColor={`${theme.primary}20`}
          />
        )}
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