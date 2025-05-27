import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import 'leaflet/dist/leaflet.css';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Marker, TileLayer, useMap } from 'react-leaflet';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppContext } from '../../../context/AppContext';
import { MapProps, Posto } from '../../../types/models';

// Calculate distance between two points in meters
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
};

interface MapUpdaterProps {
  center?: [number, number];
  zoom?: number;
}

// Memoized MapUpdater component
const MapUpdater = React.memo(({ center, zoom }: MapUpdaterProps) => {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 13);
    }
  }, [center, zoom, map]);

  return null;
});

interface CircleLayerProps {
  userLocation: { latitude: number; longitude: number };
  searchRadius: number;
}

// Memoized CircleLayer component
const CircleLayer = React.memo(({ userLocation, searchRadius }: CircleLayerProps) => {
  const map = useMap();
  const circleRef = useRef<any>(null);

  useEffect(() => {
    if (!map) return;
    
    const leaflet = (window as any).L;
    if (!leaflet) return;

    if (circleRef.current) {
      circleRef.current.remove();
    }

    circleRef.current = leaflet.circle([userLocation.latitude, userLocation.longitude], {
      radius: searchRadius * 1000,
      color: '#3b82f6',
      fillColor: '#3b82f6',
      fillOpacity: 0.1,
      weight: 2,
      dashArray: '5,5',
    }).addTo(map);

    return () => {
      if (circleRef.current) {
        circleRef.current.remove();
      }
    };
  }, [map, userLocation, searchRadius]);

  return null;
});

interface StationMarkerProps {
  station: Posto;
  isSelected: boolean;
  onClick: (station: Posto) => void;
}

// Memoized StationMarker component
const StationMarker = React.memo(({ station, isSelected, onClick }: StationMarkerProps) => {
  const [lng, lat] = station.localizacao.coordinates;
  const map = useMap();
  const [icon, setIcon] = useState<any>(null);

  useEffect(() => {
    if (!map) return;
    
    const leaflet = (window as any).L;
    if (!leaflet) return;

    const newIcon = leaflet.divIcon({
      html: `
        <div style="
          position: relative;
          width: 32px;
          height: 32px;
          cursor: pointer;
          transition: all 0.2s ease;
        ">
          <div style="
            position: absolute;
            top: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 24px;
            height: 24px;
            background: ${isSelected ? 'rgb(239, 68, 68)' : 'rgb(0, 163, 82)'};
            border: 3px solid #fff;
            border-radius: 50% 50% 50% 0;
            transform: translateX(-50%) rotate(-45deg);
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="
              width: 8px;
              height: 8px;
              background: #fff;
              border-radius: 50%;
              opacity: 0.8;
              transform: rotate(45deg);
            "></div>
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      className: ''
    });

    setIcon(newIcon);
  }, [map, isSelected]);

  if (!icon) return null;

  return (
    <Marker
      position={[lat, lng]}
      eventHandlers={{ click: () => onClick(station) }}
      icon={icon}
    />
  );
});

interface MapComponents {
  L: any;
  MapContainer: any;
  Marker: any;
  Popup: any;
  TileLayer: any;
  useMap: any;
}

const MapWeb: React.FC<MapProps> = (props) => {
  const { mapProvider } = useAppContext();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [components, setComponents] = useState<MapComponents | null>(null);
  const [selectedStation, setSelectedStation] = useState<Posto | null>(null);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const searchParams = useLocalSearchParams();
  const mapRef = useRef<any>(null);
  const router = useRouter();

  // Memoized handlers
  const handleMapReady = useCallback((map: any) => {
    if (props.mapRef) {
      props.mapRef.current = map;
    }
  }, [props.mapRef]);

  const handleMarkerClick = useCallback((station: Posto) => {
    setSelectedStation(station);
    setSelectedStationId(station.id.toString());
    props.onMarkerPress(station);
  }, [props.onMarkerPress]);

  const handleMapClick = useCallback(() => {
    setSelectedStationId(null);
    props.onMarkerPress(null);
  }, [props.onMarkerPress]);

  const handleClearSearch = useCallback(() => {
    if (mapRef.current && props.userLocation) {
      mapRef.current.setView(
        [props.userLocation.latitude, props.userLocation.longitude],
        13,
        { animate: true, duration: 1 }
      );
    }
    router.replace('/');
  }, [props.userLocation, router]);

  const handleMapMove = useCallback(() => {
    if (isSearchActive) return;

    if (mapRef.current && props.userLocation) {
      const center = mapRef.current.getCenter();
      const distance = calculateDistance(
        center.lat,
        center.lng,
        props.userLocation.latitude,
        props.userLocation.longitude
      );

      if (distance > props.searchRadius * 1000) {
        mapRef.current.setView(
          [props.userLocation.latitude, props.userLocation.longitude],
          mapRef.current.getZoom(),
          { animate: true, duration: 1 }
        );
      }
    }
  }, [isSearchActive, props.userLocation, props.searchRadius]);

  // Memoized tile layer
  const tileLayer = useMemo(() => {
    switch (mapProvider) {
      case 'cartodb_light':
        return (
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
        );
      case 'cartodb_dark':
        return (
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
        );
      default:
        return (
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
        );
    }
  }, [mapProvider]);

  // Memoized user location marker
  const userLocationMarker = useMemo(() => {
    if (!components) return null;
    const { L, Marker } = components;
    return (
      <Marker
        position={[props.userLocation.latitude, props.userLocation.longitude]}
        icon={L.divIcon({
          className: 'user-location-marker',
          html: `
            <div style="
              position: relative;
              width: 32px;
              height: 32px;
            ">
              <div style="
                position: absolute;
                top: 0;
                left: 50%;
                transform: translateX(-50%);
                width: 24px;
                height: 24px;
                background: #3b82f6;
                border: 3px solid #fff;
                border-radius: 50%;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                display: flex;
                align-items: center;
                justify-content: center;
              ">
                <div style="
                  width: 8px;
                  height: 8px;
                  background: #fff;
                  border-radius: 50%;
                  opacity: 0.8;
                "></div>
              </div>
              <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 40px;
                height: 40px;
                background: rgba(59, 130, 246, 0.2);
                border-radius: 50%;
                animation: pulse 2s infinite;
              "></div>
            </div>
            <style>
              @keyframes pulse {
                0% {
                  transform: translate(-50%, -50%) scale(0.5);
                  opacity: 1;
                }
                100% {
                  transform: translate(-50%, -50%) scale(1.5);
                  opacity: 0;
                }
              }
            </style>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        })}
      />
    );
  }, [components, props.userLocation]);

  // Memoized station markers
  const stationMarkers = useMemo(() => {
    if (!components) return null;
    return props.stations.map((station) => (
      <StationMarker
        key={station.id}
        station={station}
        isSelected={selectedStation?.id === station.id}
        onClick={handleMarkerClick}
      />
    ));
  }, [components, props.stations, selectedStation, handleMarkerClick]);

  // Load Leaflet components
  useEffect(() => {
    (async () => {
      try {
        const [Leaflet, ReactLeaflet] = await Promise.all([
          import('leaflet'),
          import('react-leaflet')
        ]);
        
        const L = Leaflet.default;
        const { MapContainer, Marker, Popup, TileLayer, useMap } = ReactLeaflet;
        
        // Fix marker icons
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
        });
        
        // Make L available globally
        (window as any).L = L;
        
        setComponents({
          L,
          MapContainer,
          Marker,
          Popup,
          TileLayer,
          useMap
        });
      } catch (error) {
        console.error('Failed to load Leaflet:', error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Handle search results from URL params
  useEffect(() => {
    const searchResults = searchParams.searchResults as string;
    const searchType = searchParams.searchType as string;
    const distrito = searchParams.distrito as string;
    const municipio = searchParams.municipio as string;

    if (searchResults && searchType === 'location') {
      setIsSearchActive(true);
      try {
        const results = JSON.parse(searchResults) as Posto[];
        if (results.length > 0) {
          const [lng, lat] = results[0].localizacao.coordinates;
          
          if (mapRef.current) {
            const originalMoveHandler = mapRef.current.options.onMoveEnd;
            mapRef.current.options.onMoveEnd = null;

            mapRef.current.setView([lat, lng], 15, {
              animate: true,
              duration: 1.5,
              easeLinearity: 0.25
            });
            
            setSelectedStation(results[0]);
            setSelectedStationId(results[0].id.toString());
            props.onMarkerPress(results[0]);

            setTimeout(() => {
              if (mapRef.current) {
                mapRef.current.options.onMoveEnd = originalMoveHandler;
              }
            }, 2000);
          }
        }
      } catch (error) {
        // Silent error handling
      }
    } else {
      setIsSearchActive(false);
    }
  }, [searchParams, props.onMarkerPress]);

  if (isLoading || !components) {
    return (
      <View style={styles.loadingContainer}>
        <Text>{t('station.loading')}</Text>
      </View>
    );
  }

  const { MapContainer } = components;

  return (
    <View style={styles.container}>
      <MapContainer
        center={[props.userLocation.latitude, props.userLocation.longitude]}
        zoom={13}
        style={styles.map}
        ref={mapRef}
        onMoveEnd={handleMapMove}
        whenReady={handleMapReady}
      >
        {tileLayer}
        {userLocationMarker}
        {stationMarkers}
        
        {/* Search Radius Circle - Only show in normal mode */}
        {!isSearchActive && (
          <CircleLayer
            userLocation={props.userLocation}
            searchRadius={props.searchRadius}
          />
        )}
      </MapContainer>

      {isSearchActive && (
        <TouchableOpacity
          className="absolute top-4 right-4 bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg flex-row items-center"
          onPress={handleClearSearch}
        >
          <Ionicons name="close-circle" size={20} color="#64748b" />
          <Text className="ml-2 text-slate-700 dark:text-slate-300">
            {t('search.clear')}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});

export default React.memo(MapWeb);
