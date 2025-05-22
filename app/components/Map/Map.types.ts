import { LatLng } from 'react-native-maps';
import { Posto } from '../../types/models';
export * from '../../types/models';

export interface MapProps {
  stations: Posto[];
  userLocation: {
    latitude: number;
    longitude: number;
  };
  selectedFuelType: string;
  onMarkerPress: (station: Posto | null) => void;
  onMapPress?: (coordinate: LatLng) => void;
  initialZoom?: number;
  style?: any;
  searchRadius: number;
  mapRef?: React.RefObject<any>;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
}

export interface MapMarkerProps {
  station: Posto;
  onPress: (station: Posto) => void;
}

export interface UserMarkerProps {
  userLocation: UserLocation;
}

// Add a default export to satisfy the router
export default {
  name: 'MapTypes',
  version: '1.0.0'
};
