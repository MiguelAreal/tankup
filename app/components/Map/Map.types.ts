// app/components/Map/Map.types.ts
import { LocationObjectCoords } from 'expo-location';
import { Posto } from '../../../types/models/Posto';

export interface MapProps {
  stations: Posto[];
  selectedStation: Posto | null;
  onMarkerPress: (station: Posto | null) => void;
  userLocation: LocationObjectCoords | { latitude: number; longitude: number };
  isSearchActive?: boolean;
  searchRadius?: number;
  selectedFuelType: string;
  style?: any;
  onMapReady?: () => void;
  center?: [number, number];
  zoom?: number;
  allowInteraction?: boolean;
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
