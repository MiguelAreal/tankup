import { LatLng } from 'react-native-maps';
import { Posto } from './Posto';

export interface MapProps {
  stations: Posto[];
  selectedStation: Posto | null;
  onMarkerPress: (station: Posto | null) => void;
  userLocation: {
    latitude: number;
    longitude: number;
  };
  isSearchActive?: boolean;
  searchRadius?: number;
  selectedFuelType: string;
  style?: any;
  onMapPress?: (coordinate: LatLng) => void;
  onStationListScroll?: (station: Posto) => void;
  initialZoom?: number;
  mapRef?: React.RefObject<any>;
  center?: [number, number];
  zoom?: number;
  allowInteraction?: boolean;
}

export default MapProps; 