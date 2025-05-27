import { Posto } from './Posto';

export type MapMarkerProps = {
  station: Posto;
  selectedFuelType: string;
  onPress?: (station: Posto | null) => void;
}; 

export default MapMarkerProps; 