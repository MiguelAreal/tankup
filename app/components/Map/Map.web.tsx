import React, { useContext, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppContext } from '../../../context/AppContext';
import stringsEN from '../../assets/strings.en.json';
import stringsPT from '../../assets/strings.pt.json';
import { Strings } from '../../types/strings';
import { Station } from './Map.types';

// Map provider options with their display names and URLs
const mapProviders = {
  openstreetmap: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors'
  },
  cartodb: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    attribution: '© CartoDB'
  },
  stamen: {
    url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.png',
    attribution: '© Stamen Design'
  },
  esri: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '© ESRI'
  }
};

interface MapProps {
  stations: Station[];
  userLocation: { latitude: number; longitude: number };
  selectedFuelType: string;
  onMarkerPress: (station: Station | null) => void;
  searchRadius: number;
  mapRef: React.RefObject<any>;
}

const MapWeb: React.FC<MapProps> = (props) => {
  const { mapProvider, language } = useContext(AppContext);
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

  const handleMarkerClick = (station: Station) => {
    setSelectedStationId(station.idDgeg.toString());
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
        url={mapProviders[mapProvider].url}
        attribution={mapProviders[mapProvider].attribution}
      />

      <Marker position={[props.userLocation.latitude, props.userLocation.longitude]} icon={userIcon} />

      {props.stations.map((station) => (
        <Marker
          key={station.idDgeg}
          position={[station.localizacao.coordinates[1], station.localizacao.coordinates[0]]}
          icon={createStationIcon(station.idDgeg.toString() === selectedStationId)}
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
