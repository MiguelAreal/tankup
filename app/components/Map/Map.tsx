import { Ionicons } from '@expo/vector-icons'; // <--- Importar Icones
import { useRouter } from 'expo-router';
import React, { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ClusteredMapView from 'react-native-map-clustering';
import { Callout, Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
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
  const router = useRouter();
  const mapRef = useRef<any>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  
  React.useImperativeHandle(ref, () => mapRef.current);

  // --- Map Region Update Logic ---
  useEffect(() => {
    if (mapRef.current && userLocation) {
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

  const handleCalloutPress = useCallback((station: Posto) => {
    router.push({
      pathname: '/station/[id]',
      params: { 
        id: station.id, 
        stationData: JSON.stringify(station) 
      }
    } as any);
  }, [router]);

  const handleMapPress = useCallback(() => {
    onMarkerPress(null);
  }, [onMarkerPress]);

  const handleMapReady = useCallback(() => {
    setIsMapReady(true);
    if (onMapReady) onMapReady();
  }, [onMapReady]);

  // --- Render Cluster ---
  const renderCluster = (cluster: any) => {
    const { id, geometry, onPress, properties } = cluster;
    const points = properties.point_count;
    const size = 35 + (points > 10 ? 10 : 0) + (points > 50 ? 10 : 0);

    return (
      <Marker
        key={`cluster-${id}`}
        coordinate={{
          longitude: geometry.coordinates[0],
          latitude: geometry.coordinates[1],
        }}
        onPress={onPress}
        tracksViewChanges={false}
      >
        <View style={[styles.clusterContainer, { 
            width: size, 
            height: size, 
            borderRadius: size / 2,
            backgroundColor: theme.primary,
            borderColor: theme.background
        }]}>
          <Text style={styles.clusterText}>{points}</Text>
        </View>
      </Marker>
    );
  };

  // --- Station Markers ---
  const stationMarkers = useMemo(() => {
    return stations.map((station) => {
      const [lng, lat] = station.localizacao.coordinates;
      const isSelected = selectedStation?.id === station.id;
      
      return (
        <Marker
          key={station.id}
          coordinate={{ latitude: lat, longitude: lng }}
          onPress={() => handleMarkerPress(station)}
          tracksViewChanges={false}
        >
          <View style={styles.markerContainer}>
            <View style={[styles.markerIcon, isSelected && styles.selectedMarkerIcon]}>
              <View style={styles.markerDot} />
            </View>
          </View>
          
          <Callout tooltip onPress={() => handleCalloutPress(station)}>
            <View style={styles.calloutContainer}>
              <PostoCard
                station={station}
                userLocation={userLocation}
                selectedFuelType={selectedFuelType}
                isSelected={isSelected}
                preferredNavigationApp={preferredNavigationApp}
                onPress={() => {}} 
                showDistance={!isSearchActive}
              />
            </View>
          </Callout>
        </Marker>
      );
    });
  }, [stations, selectedStation, selectedFuelType, handleMarkerPress, userLocation, preferredNavigationApp, isSearchActive, handleCalloutPress]);

  return (
    <View style={[styles.container, style]}>
      <ClusteredMapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.0421,
          longitudeDelta: 0.0421,
        }}
        clusterColor={theme.primary}
        clusterTextColor="#ffffff"
        renderCluster={renderCluster}
        animationEnabled={true}
        // Desligamos o nativo para usar o nosso customizado, ou deixamos ambos
        showsUserLocation={false} 
        showsMyLocationButton={true} // O botão continua útil
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
        
        {/* --- MARCADOR DA LOCALIZAÇÃO DO UTILIZADOR --- */}
        {userLocation && (
          <Marker
            key="user-location"
            coordinate={{ 
              latitude: userLocation.latitude, 
              longitude: userLocation.longitude 
            }}
            zIndex={999} // Garante que fica por cima
            tracksViewChanges={false}
          >
            <View style={styles.userMarkerContainer}>
              <View style={styles.userMarkerDot}>
                <Ionicons name="person" size={14} color="white" />
              </View>
              <View style={styles.userMarkerRing} />
            </View>
          </Marker>
        )}

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
      </ClusteredMapView>
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
  // Clusters
  clusterContainer: {
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5,
  },
  clusterText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  
  // --- Estilos do User Marker ---
  userMarkerContainer: {
    width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center',
  },
  userMarkerDot: {
    width: 24, height: 24,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    borderWidth: 2, borderColor: 'white',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 2,
  },
  userMarkerRing: {
    position: 'absolute',
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    zIndex: 1,
  }
});

Map.displayName = 'Map';
export default Map;