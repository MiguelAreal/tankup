export type Station = {
  id: string;
  name: string;
  brand: string;
  address: string;
  distance: number;
  latitude: number;
  longitude: number;
  fuels: {
    type: string;
    price: number;
  }[];
};

export type MapProps = {
  stations: Station[];
  userLocation: { latitude: number; longitude: number };
  selectedFuelType: string;
  onMarkerPress?: (station: Station) => void;
};
