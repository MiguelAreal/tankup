import { LatLng } from 'react-native-maps';

export interface Station {
  idDgeg: number;
  nome: string;
  marca: string;
  morada: {
    distrito: string;
    municipio: string;
    morada: string;
    localidade: string;
    codPostal: string;
  };
  localizacao: {
    type: string;
    coordinates: [number, number];
  };
  horario: {
    diasUteis: string;
    sabado: string;
    domingo: string;
    feriado: string;
  };
  ultimaAtualizacao: string;
  distancia: number;
  combustiveis: {
    tipo: string;
    preco: number;
    dataAtualizacao: string;
  }[];
}

export interface MapProps {
  stations: Station[];
  userLocation: { latitude: number; longitude: number };
  selectedFuelType: string;
  onMarkerPress: (station: Station | null) => void;
  onMapPress?: (coordinate: LatLng) => void;
  initialZoom?: number;
  style?: any;
  searchRadius: number;
  mapRef: React.RefObject<any>;
}

export type UserLocation = {
  latitude: number;
  longitude: number;
};

export type MapMarkerProps = {
  station: Station;
  selectedFuelType: string;
  onPress?: (station: Station | null) => void;
};

export type UserMarkerProps = {
  location: UserLocation;
};

// Add a default export to satisfy the router
export default {
  name: 'MapTypes',
  version: '1.0.0'
};
