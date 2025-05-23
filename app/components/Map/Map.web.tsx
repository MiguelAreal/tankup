import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import 'leaflet/dist/leaflet.css';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMap } from 'react-leaflet';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppContext } from '../../../context/AppContext';
import stringsEN from '../../assets/strings.en.json';
import stringsPT from '../../assets/strings.pt.json';
import { MapProps, Posto } from '../../types/models';
import { Strings } from '../../types/strings';

// Component to handle map updates
function MapUpdater({ center, zoom }: { center?: [number, number]; zoom?: number }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 13);
    }
  }, [center, zoom, map]);

  return null;
}

const MapWeb: React.FC<MapProps> = (props) => {
  const { mapProvider, language } = useAppContext();
  const strings = (language === 'en' ? stringsEN : stringsPT) as Strings;
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [components, setComponents] = useState<{
    L: any;
    MapContainer: any;
    Marker: any;
    Popup: any;
    TileLayer: any;
    useMap: any;
  } | null>(null);
  const [selectedStation, setSelectedStation] = useState<Posto | null>(null);
  const [districtBoundary, setDistrictBoundary] = useState<any>(null);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const searchParams = useLocalSearchParams();
  const mapRef = useRef<any>(null);
  const router = useRouter();
  const { t } = useTranslation();

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
        
        setComponents({
          L,
          MapContainer,
          Marker,
          Popup,
          TileLayer,
          useMap
        });
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
        // Update stations with search results
        if (results.length > 0) {
          // Get coordinates of first station
          const [lng, lat] = results[0].localizacao.coordinates;
          
          // Update map view to center on first station
          if (mapRef.current) {
            mapRef.current.setView([lat, lng], 13, {
              animate: true,
              duration: 1
            });
          }
        }
      } catch (error) {
        console.error('Error parsing search results:', error);
      }
    } else {
      setIsSearchActive(false);
    }
  }, [searchParams]);

  const handleClearSearch = () => {
    // Center map on user location before clearing search
    if (mapRef.current && props.userLocation) {
      mapRef.current.setView(
        [props.userLocation.latitude, props.userLocation.longitude],
        13,
        { animate: true, duration: 1 }
      );
    }
    router.replace('/');
  };

  // Handle map movement
  const handleMapMove = () => {
    if (isSearchActive) {
      // When in search mode, allow free map navigation
      return;
    }

    // In normal mode, recenter on user location if they move too far
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
  };

  // Calculate distance between two points in meters
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
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

  if (isLoading || !components) {
    return (
      <View style={styles.loadingContainer}>
        <Text>{strings.station?.loading}</Text>
      </View>
    );
  }

  const { L, MapContainer, Marker, TileLayer, useMap } = components;

  const createStationIcon = (isSelected: boolean) => L.divIcon({
    html: `
      <div class="station-marker ${isSelected ? 'selected' : ''}" style="
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
      <style>
        .station-marker.selected {
          transform: scale(1.2);
        }
        .station-marker:hover {
          transform: scale(1.1);
        }
      </style>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    className: ''
  });

  const userIcon = L.divIcon({
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

  const handleMarkerClick = (station: Posto) => {
    setSelectedStation(station);
    setSelectedStationId(station.idDgeg.toString());
    props.onMarkerPress(station);
  };

  const handleMapClick = () => {
    setSelectedStationId(null);
    props.onMarkerPress(null);
  };

  const getTileLayer = () => {
    switch (mapProvider) {
      case 'cartodb':
        return (
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
        );
      case 'stamen':
        return (
          <TileLayer
            url="https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.png"
            attribution='Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
        );
      case 'esri':
        return (
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
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
  };

  return (
    <View style={styles.container}>
      {components && (
        <MapContainer
          center={[props.userLocation.latitude, props.userLocation.longitude]}
          zoom={13}
          style={styles.map}
          ref={mapRef}
          onMoveEnd={handleMapMove}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {/* User Location Marker */}
          <Marker
            position={[props.userLocation.latitude, props.userLocation.longitude]}
            icon={components.L.divIcon({
              className: 'user-location-marker',
              html: `<div class="user-location-pulse"></div>`,
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            })}
          />

          {/* Station Markers */}
          {props.stations.map((station) => {
            const [lng, lat] = station.localizacao.coordinates;
            return (
              <Marker
                key={station.idDgeg}
                position={[lat, lng]}
                eventHandlers={{
                  click: () => handleMarkerClick(station)
                }}
                icon={L.divIcon({
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
                        background: ${selectedStation?.idDgeg === station.idDgeg ? 'rgb(239, 68, 68)' : 'rgb(0, 163, 82)'};
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
                })}
              />
            );
          })}

          {/* Search Radius Circle - Only show in normal mode */}
          {!isSearchActive && (
            <CircleLayer
              L={components.L}
              userLocation={props.userLocation}
              searchRadius={props.searchRadius}
              useMap={useMap}
            />
          )}
        </MapContainer>
      )}

      {isSearchActive && (
        <TouchableOpacity
          className="absolute top-4 right-4 bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg flex-row items-center"
          onPress={handleClearSearch}
        >
          <Ionicons name="close-circle" size={20} color="#64748b" />
          <Text className="ml-2 text-slate-700 dark:text-slate-300">
            {language === 'en' ? 'Clear Search' : 'Limpar Pesquisa'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Separate component for the circle layer
const CircleLayer: React.FC<{
  L: any;
  userLocation: { latitude: number; longitude: number };
  searchRadius: number;
  useMap: any;
}> = ({ L, userLocation, searchRadius, useMap }) => {
  const map = useMap();
  const circleRef = useRef<any>(null);

  useEffect(() => {
    if (!map || !L) return;
    if (circleRef.current) circleRef.current.remove();

    circleRef.current = L.circle([userLocation.latitude, userLocation.longitude], {
      radius: searchRadius * 1000,
      color: '#3b82f6',
      fillColor: '#3b82f6',
      fillOpacity: 0.1,
      weight: 2,
      dashArray: '5,5',
    }).addTo(map);

    return () => {
      if (circleRef.current) circleRef.current.remove();
    };
  }, [userLocation, searchRadius, map, L]);

  return null;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9', // bg-slate-100
  },
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});

export default MapWeb;
