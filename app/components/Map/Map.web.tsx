import React from 'react';
import { Text, View } from 'react-native';
import { MapProps } from './Map.types';

// This component handles the web map implementation using Leaflet
const MapWeb: React.FC<MapProps> = ({
  stations,
  userLocation,
  selectedFuelType,
  onMarkerPress,
}) => {
  // Create a ref for the map container with a unique ID
  const mapId = React.useRef(`map-${Math.random().toString(36).substring(2, 9)}`).current;
  const [mapError, setMapError] = React.useState<string | null>(null);
  const leafletMapRef = React.useRef<any>(null);
  const markersRef = React.useRef<any[]>([]);

  // Add required CSS for Leaflet
  React.useEffect(() => {
    // Inject Leaflet CSS if not already present
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }

    // Clean up function - ensure everything is properly cleaned up
    return () => {
      if (leafletMapRef.current) {
        // Properly remove all markers first
        markersRef.current.forEach(marker => {
          if (marker) {
            marker.remove();
          }
        });
        // Then remove the map
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        markersRef.current = [];
      }
    };
  }, []);

  // Initialize the map when the component mounts
  React.useEffect(() => {
    // Don't recreate the map if it already exists
    if (leafletMapRef.current) {
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
    }

    let isMounted = true;

    // Dynamic import to avoid bundling issues
    const initializeMap = async () => {
      try {
        // Load leaflet dynamically
        const L = await import('leaflet');
        
        // If the component was unmounted during the async operation, abort
        if (!isMounted) return;

        // Create custom station icon
        const stationIcon = L.icon({
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        });
        
        // Get the map container element by ID
        const mapContainer = document.getElementById(mapId);
        if (!mapContainer) {
          console.error('Map container not found');
          return;
        }

        // Initialize the map
        const map = L.map(mapId).setView(
          [userLocation.latitude, userLocation.longitude], 
          13
        );
        
        // Add tile layer
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(map);
        
        // Add user location marker with custom icon
        const userIcon = L.divIcon({
          html: `<div style="
            background-color: #2563eb;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 0 4px rgba(0,0,0,0.3);
          "></div>`,
          className: 'user-location-marker',
          iconSize: [22, 22],
          iconAnchor: [11, 11]
        });

        L.marker([userLocation.latitude, userLocation.longitude], { icon: userIcon })
          .addTo(map)
          .bindPopup('Você está aqui')
          .openPopup();
        
        // Add station markers
        markersRef.current = stations.map(station => {
          const fuel = station.fuels.find(f => f.type === selectedFuelType);
          const popupContent = `
            <div>
              <strong>${station.name}</strong><br/>
              ${fuel 
                ? `${selectedFuelType}: ${fuel.price.toFixed(3)} €/L` 
                : 'Preço não disponível'}
            </div>
          `;
          
          const marker = L.marker([station.latitude, station.longitude], { icon: stationIcon })
            .addTo(map)
            .bindPopup(popupContent);
          
          // Add click handler if provided
          if (onMarkerPress) {
            marker.on('click', () => onMarkerPress(station));
          }
          
          return marker;
        });
        
        // Store the map reference for cleanup
        leafletMapRef.current = map;
        
        // Handle resize events to keep the map properly sized
        const handleResize = () => {
          if (leafletMapRef.current) {
            leafletMapRef.current.invalidateSize();
          }
        };
        
        window.addEventListener('resize', handleResize);
        
        // Clean up resize listener
        return () => {
          window.removeEventListener('resize', handleResize);
        };
        
      } catch (error) {
        console.error('Failed to initialize Leaflet map:', error);
        if (isMounted) {
          setMapError('Erro ao carregar o mapa. Por favor, verifique se leaflet está instalado corretamente.');
        }
      }
    };
    
    initializeMap();
    
    // Cleanup function
    return () => {
      isMounted = false;
      if (leafletMapRef.current) {
        // Properly remove all markers first
        markersRef.current.forEach(marker => {
          if (marker) {
            marker.remove();
          }
        });
        // Then remove the map
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        markersRef.current = [];
      }
    };
  }, [userLocation, mapId]); // Only recreate when location changes or ID changes

  // Update markers when selected fuel type or stations change
  React.useEffect(() => {
    if (!leafletMapRef.current) return;
    
    try {
      // First remove old markers
      markersRef.current.forEach(marker => {
        if (marker) {
          marker.remove();
        }
      });
      
      markersRef.current = [];
      
      // Dynamically import Leaflet
      import('leaflet').then(L => {
        // Create custom station icon
        const stationIcon = L.icon({
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        });
        
        // Add station markers again
        markersRef.current = stations.map(station => {
          const fuel = station.fuels.find(f => f.type === selectedFuelType);
          const popupContent = `
            <div>
              <strong>${station.name}</strong><br/>
              ${fuel 
                ? `${selectedFuelType}: ${fuel.price.toFixed(3)} €/L` 
                : 'Preço não disponível'}
            </div>
          `;
          
          const marker = L.marker([station.latitude, station.longitude], { icon: stationIcon })
            .addTo(leafletMapRef.current)
            .bindPopup(popupContent);
          
          // Add click handler if provided
          if (onMarkerPress) {
            marker.on('click', () => onMarkerPress(station));
          }
          
          return marker;
        });
      });
    } catch (error) {
      console.error('Failed to update markers:', error);
    }
  }, [selectedFuelType, stations, onMarkerPress]);

  if (mapError) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-slate-600 dark:text-slate-400">
          {mapError}
        </Text>
      </View>
    );
  }

  return (
    <div 
      id={mapId}
      style={{ height: '100%', width: '100%' }}
    />
  );
};

export default MapWeb;