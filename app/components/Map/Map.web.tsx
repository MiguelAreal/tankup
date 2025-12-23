import { Posto } from '@/types/models/Posto';
import { useRouter } from 'expo-router';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { useAppContext } from '../../context/AppContext';
import PostoCard from '../PostoCard';
import { MapProps } from './Map.types';

// --- Fix Leaflet icon paths (Boilerplate obrigatório para Web) ---
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// --- Componente auxiliar para recentrar o mapa ---
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
  const router = useRouter();
  const [mapReady, setMapReady] = useState(false);

  const center: [number, number] = useMemo(
    () => [userLocation.latitude, userLocation.longitude],
    [userLocation]
  );

  const handleMarkerPress = useCallback((station: Posto | null) => {
      onMarkerPress(station);
    }, [onMarkerPress]);

  // Handler para navegar quando se clica no cartão dentro do mapa
  const handleCardPress = useCallback((station: Posto) => {
    router.push({
      pathname: '/station/[id]',
      params: { 
        id: station.id, 
        stationData: JSON.stringify(station) 
      }
    } as any);
  }, [router]);

  // --- Ícone Personalizado para o Utilizador (Bola Azul com Pulso) ---
  const userIcon = L.divIcon({
    html: `
      <div style="position: relative; width: 24px; height: 24px;">
        <div style="
          position: absolute; top: 0; left: 0;
          width: 24px; height: 24px;
          background-color: #3b82f6;
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          z-index: 2;
        "></div>
        <div style="
          position: absolute; top: -8px; left: -8px;
          width: 40px; height: 40px;
          background-color: rgba(59, 130, 246, 0.3);
          border-radius: 50%;
          z-index: 1;
          animation: pulse 2s infinite;
        "></div>
        <style>
          @keyframes pulse {
            0% { transform: scale(0.5); opacity: 0; }
            50% { opacity: 0.5; }
            100% { transform: scale(1.2); opacity: 0; }
          }
        </style>
      </div>
    `,
    className: 'custom-user-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12], // Centrado
  });

  // --- Ícone Personalizado para Clusters (Círculo com a cor do tema) ---
  const createClusterCustomIcon = function (cluster: any) {
    const count = cluster.getChildCount();
    
    // Tamanho dinâmico (opcional, aqui fixo em 30px mas podes aumentar)
    // const size = count > 100 ? 40 : 30;

    return L.divIcon({
      html: `
        <div style="
          background-color: ${theme.primary};
          width: 30px; height: 30px;
          border-radius: 50%; 
          border: 3px solid white;
          color: white; 
          display: flex; 
          align-items: center; 
          justify-content: center;
          font-weight: bold; 
          font-family: sans-serif;
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        ">
          <span>${count}</span>
        </div>
      `,
      className: 'custom-marker-cluster',
      iconSize: L.point(30, 30, true),
    });
  };

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
          <Popup 
            key={preferredNavigationApp} 
            closeButton={false} 
            className="tu-popup" 
            autoPan={true}
            autoPanPadding={[50, 50]}
          >
            {/* Wrapper div para controlar largura na web */}
            <div style={{ width: '300px', margin: '0' }}> 
              <PostoCard
                station={station}
                userLocation={userLocation}
                selectedFuelType={selectedFuelType}
                isSelected={isSelected}
                preferredNavigationApp={preferredNavigationApp}
                onPress={handleCardPress}
                showDistance={!isSearchActive}
              />
            </div>
          </Popup>
        </Marker>
      );
    });
  }, [stations, selectedStation, selectedFuelType, handleMarkerPress, userLocation, preferredNavigationApp, isSearchActive, handleCardPress]); 

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
        <TileLayer 
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
        />
        
        <ChangeView center={center} />
        
        {/* Raio de pesquisa (Apenas se não for pesquisa remota) */}
        {!isSearchActive && searchRadius > 0 && (
          <Circle
            center={center}
            radius={searchRadius * 1000}
            pathOptions={{ color: theme.primary, fillColor: theme.primary, fillOpacity: 0.1 }}
          />
        )}

        {/* 1. Marcador do Utilizador (FORA DO CLUSTER) */}
        {userLocation && (
          <Marker 
            position={[userLocation.latitude, userLocation.longitude]} 
            icon={userIcon}
            zIndexOffset={1000} // Sempre no topo
          />
        )}

        {/* 2. Marcadores dos Postos (DENTRO DO CLUSTER) */}
        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={createClusterCustomIcon}
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
          maxClusterRadius={60} // Ajusta a densidade do agrupamento
        >
          {stationMarkers}
        </MarkerClusterGroup>

      </MapContainer>
    </div>
  );
};

export default Map;