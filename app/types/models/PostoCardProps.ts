import { Posto } from './Posto';

export interface PostoCardProps {
  posto: Posto;
  userLocation: {
    latitude: number;
    longitude: number;
  };
  selectedFuelType: string;
} 