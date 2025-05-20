// app/components/Map/Map.tsx
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { MapProps } from './Map.types';

// Import platform-specific components directly
import MapNative from './Map.native';
import MapWeb from './Map.web';

const Map: React.FC<MapProps> = (props) => {
  // Use Platform.OS for more reliable platform detection
  const MapComponent = Platform.OS === 'web' ? MapWeb : MapNative;

  if (!MapComponent) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading map...</Text>
      </View>
    );
  }

  return <MapComponent {...props} />;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Map;