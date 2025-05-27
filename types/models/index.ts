export * from './MapMarkerProps';
export * from './MapProps';
export * from './Posto';
export * from './PostoCardProps';
export * from './UserLocation';
export * from './UserMarkerProps';

const Models = {
  MapMarkerProps: require('./MapMarkerProps').default,
  MapProps: require('./MapProps').default,
  Posto: require('./Posto').default,
  PostoCardProps: require('./PostoCardProps').default,
  UserLocation: require('./UserLocation').default,
  UserMarkerProps: require('./UserMarkerProps').default,
};

export default Models;

