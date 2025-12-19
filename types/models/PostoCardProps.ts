import { Posto } from './Posto';

/**
 * PostoCardProps interface defining the props for a PostoCard component.
 */
export interface PostoCardProps {
  posto: Posto;
  userLocation: {
    latitude: number;
    longitude: number;
  };
  selectedFuelType: string;
}

export default PostoCardProps; 