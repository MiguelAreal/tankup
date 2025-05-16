// MapNative.tsx
/*import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Callout, Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import { MapProps } from './Map.types';

const MapNative: React.FC<MapProps> = ({
  stations,
  userLocation,
  selectedFuelType,
  onMarkerPress,
}) => {
  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        <Marker
          coordinate={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          }}
          pinColor="blue"
        >
          <Callout>
            <Text>Você está aqui</Text>
          </Callout>
        </Marker>

        {stations.map((station: typeof stations[number]) => {
          const fuel = station.fuels.find((f: typeof station.fuels[number]) => f.type === selectedFuelType);
          
          return (
            <Marker
              key={station.id}
              coordinate={{
                latitude: station.latitude,
                longitude: station.longitude,
              }}
              onPress={() => onMarkerPress && onMarkerPress(station)}
            >
              <Callout>
                <View style={styles.callout}>
                  <Text style={styles.stationName}>{station.name}</Text>
                  {fuel ? (
                    <Text>
                      {selectedFuelType}: {fuel.price.toFixed(3)} €/L
                    </Text>
                  ) : (
                    <Text>Preço não disponível</Text>
                  )}
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  callout: {
    padding: 5,
    maxWidth: 200,
  },
  stationName: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
});

export default MapNative;*/