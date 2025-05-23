import { LatLng } from 'react-native-maps';
import { Posto } from './Posto';

export interface MapProps {
  stations: Posto[];
  userLocation: { latitude: number; longitude: number };
  selectedFuelType: string;
  onMarkerPress: (station: Posto | null) => void;
  onMapPress?: (coordinate: LatLng) => void;
  initialZoom?: number;
  style?: any;
  searchRadius: number;
  mapRef?: React.RefObject<any>;
  center?: [number, number];
  zoom?: number;
  allowInteraction?: boolean;
  selectedStation?: Posto | null;
} 