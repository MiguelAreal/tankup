// Map.web.tsx
import { Posto } from '@/types/models';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { useAppContext } from '../../context/AppContext';
import PostoCard from '../PostoCard';
import { MapProps } from './Map.types';

// Fix Leaflet icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, 14, { animate: true });
  }, [center, map]);
  return null;
}

const Map: React.FC<MapProps> = ({
  stations,
  selectedStation,
  onMarkerPress,
  userLocation,
  isSearchActive,
  searchRadius = 0,
  selectedFuelType,
  style,
  onMapReady,
  preferredNavigationApp,
}) => {
  const { theme } = useAppContext();
  const [mapReady, setMapReady] = useState(false);

  const center: [number, number] = useMemo(
    () => [userLocation.latitude, userLocation.longitude],
    [userLocation]
  );

  const handleMarkerPress = useCallback(
    (station: Posto | null) => {
      onMarkerPress(station);
    },
    [onMarkerPress]
  );

  const stationMarkers = useMemo(() => {
    return stations.map((station) => {
      const [lng, lat] = station.localizacao.coordinates;
      const isSelected = selectedStation?.id === station.id;

      return (
        <Marker
          key={station.id}
          position={[lat, lng]}
          eventHandlers={{ click: () => handleMarkerPress(station) }}
        >
          <Popup key={preferredNavigationApp} closeButton={false} className="tu-popup" autoPan={false}>
            <PostoCard
              station={station}
              userLocation={userLocation}
              selectedFuelType={selectedFuelType}
              isSelected={isSelected}
              preferredNavigationApp={preferredNavigationApp}
            />
          </Popup>
        </Marker>
      );
    });
  }, [stations, selectedStation, selectedFuelType, handleMarkerPress, userLocation, preferredNavigationApp]); 

  return (
    <div style={{ flex: 1, ...style }}>
      <MapContainer
        center={center}
        zoom={14}
        style={{ width: '100%', height: '100%' }}
        whenReady={() => {
          setMapReady(true);
          if (onMapReady) onMapReady();
        }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ChangeView center={center} />
        {!isSearchActive && searchRadius > 0 && (
          <Circle
            center={center}
            radius={searchRadius * 1000}
            pathOptions={{ color: theme.primary, fillColor: theme.primary, fillOpacity: 0.1 }}
          />
        )}
        {stationMarkers}
      </MapContainer>
    </div>
  );
};


export default Map;
