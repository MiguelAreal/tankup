import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Station } from './Map.types';

interface MapProps {
  stations: Station[];
  userLocation: { latitude: number; longitude: number };
  selectedFuelType: string;
  onMarkerPress: (station: Station | null) => void;
  searchRadius: number;
  mapRef: React.RefObject<any>;
}

const MapWeb: React.FC<MapProps> = (props) => {
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

  if (isLoading || !components) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading map...</Text>
      </View>
    );
  }

  const { L, MapContainer, Marker, TileLayer, useMap } = components;

  const createStationIcon = (isSelected: boolean) => L.divIcon({
    html: `<div style="
      width: 12px;
      height: 12px;
      background: ${isSelected ? 'rgb(239, 68, 68)' : 'rgb(0, 163, 82)'};
      border: 2px solid #fff;
      border-radius: 50%;
      box-sizing: border-box;
      transition: background-color 0.2s ease;
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    className: ''
  });

  const userIcon = L.divIcon({
    html: `<div style="
      width: 12px;
      height: 12px;
      background: #3b82f6;
      border: 2px solid #fff;
      border-radius: 50%;
      box-sizing: border-box;
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    className: ''
  });

  const handleMarkerClick = (station: Station) => {
    setSelectedStationId(station.id);
    props.onMarkerPress(station);
  };

  const handleMapClick = () => {
    setSelectedStationId(null);
    props.onMarkerPress(null);
  };

  return (
    <MapContainer
      center={[props.userLocation.latitude, props.userLocation.longitude]}
      zoom={13}
      className="h-full w-full"
      ref={props.mapRef}
      onClick={handleMapClick}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
      />

      <Marker position={[props.userLocation.latitude, props.userLocation.longitude]} icon={userIcon} />

      {props.stations.map((station) => (
        <Marker
          key={station.id}
          position={[station.latitude, station.longitude]}
          icon={createStationIcon(station.id === selectedStationId)}
          eventHandlers={{
            click: () => handleMarkerClick(station),
          }}
        />
      ))}

      <CircleLayer
        L={L}
        userLocation={props.userLocation}
        searchRadius={props.searchRadius}
        useMap={useMap}
      />
    </MapContainer>
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
});

export default MapWeb;
