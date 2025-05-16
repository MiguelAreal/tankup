// app/components/Map/Map.tsx
import { Platform } from 'react-native';

const Map = Platform.OS === 'web'
  ? require('./Map.web').default
  : require('./Map.native').default;

export default Map;
