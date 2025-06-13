import { LocationObjectCoords } from 'expo-location';
import { Posto } from '../../../types/models/Posto';
export * from '../../../types/models';

export interface MapProps {
  stations: Posto[];
  selectedStation: Posto | null;
  onMarkerPress: (station: Posto | null) => void;
  userLocation: LocationObjectCoords | { latitude: number; longitude: number };
  isSearchActive: boolean;
  searchRadius: number;
  selectedFuelType: string;
  style?: any;
  onMapReady?: () => void;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
}

export interface MapMarkerProps {
  station: Posto;
  isSelected: boolean;
  onPress: () => void;
  selectedFuelType: string;
}

export interface UserMarkerProps {
  location: LocationObjectCoords;
}

// Add a default export to satisfy the router
export default {
  name: 'MapTypes',
  version: '1.0.0'
};
