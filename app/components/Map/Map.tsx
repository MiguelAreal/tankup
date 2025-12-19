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
  const mapRef = useRef<MapView>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  
  // Expor a ref interna para o pai
  React.useImperativeHandle(ref, () => mapRef.current);

  // --- Map Region Update Logic ---
  useEffect(() => {
    if (mapRef.current && userLocation) {
      // Ajusta o zoom dependendo se é pesquisa de cidade ou GPS local
      const zoomDelta = isSearchActive ? 0.06 : 0.0421; 

      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: zoomDelta * 2,
        longitudeDelta: zoomDelta,
      }, 1000);
    }
  }, [userLocation, isSearchActive]);

  // --- Handlers ---
  const handleMarkerPress = useCallback((station: Posto) => {
    onMarkerPress(station);
    if (mapRef.current) {
      const [lng, lat] = station.localizacao.coordinates;
      mapRef.current.animateToRegion({
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
    }
  }, [onMarkerPress]);

  const handleMapPress = useCallback(() => {
    onMarkerPress(null);
  }, [onMarkerPress]);

  const handleMapReady = useCallback(() => {
    setIsMapReady(true);
    if (onMapReady) onMapReady();
  }, [onMapReady]);

  // --- Memoized Markers ---
  const stationMarkers = useMemo(() => {
    return stations.map((station) => {
      const [lng, lat] = station.localizacao.coordinates;
      const isSelected = selectedStation?.id === station.id;
      
      return (
        <Marker
          key={station.id}
          coordinate={{ latitude: lat, longitude: lng }}
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
  }, [stations, selectedStation, selectedFuelType, handleMarkerPress, userLocation, preferredNavigationApp]);

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.0421,
          longitudeDelta: 0.0421,
        }}
        showsUserLocation={!isSearchActive} // Esconde a bola azul se estivermos a ver outra cidade
        showsMyLocationButton={!isSearchActive}
        showsCompass
        showsScale
        moveOnMarkerPress={false}
        onPress={handleMapPress}
        onMapReady={handleMapReady}
        loadingEnabled
        loadingIndicatorColor={theme.primary}
        loadingBackgroundColor={theme.background}
      >
        {stationMarkers}
        
        {!isSearchActive && searchRadius > 0 && (
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
  container: { flex: 1 },
  map: { flex: 1 },
  calloutContainer: { width: 300 },
  markerContainer: { width: 32, height: 32, alignItems: 'center', justifyContent: 'flex-start' },
  markerIcon: {
    width: 24, height: 24,
    backgroundColor: 'rgb(0, 163, 82)',
    borderWidth: 3, borderColor: '#fff', borderRadius: 12,
    transform: [{ rotate: '-45deg' }],
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4,
  },
  selectedMarkerIcon: { backgroundColor: 'rgb(239, 68, 68)' },
  markerDot: {
    width: 8, height: 8,
    backgroundColor: '#fff', borderRadius: 4, opacity: 0.8,
    transform: [{ rotate: '45deg' }],
  },
});

Map.displayName = 'Map';

export default Map;