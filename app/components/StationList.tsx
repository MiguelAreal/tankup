import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Dimensions, ScrollView, Text, View } from 'react-native';
import { useAppContext } from '../context/AppContext';
import { Posto } from '../../types/models';
import FuelTypeSelector from './FuelTypeSelector';
import PostoCard from './PostoCard';

type StationListProps = {
  stations: Posto[];
  userLocation: {
    latitude: number;
    longitude: number;
  };
  selectedFuelType: string;
  selectedStation: Posto | null;
  preferredNavigationApp: 'google_maps' | 'waze' | 'apple_maps';
  onScroll?: (event: any) => void;
  onMeasureCardHeight?: (index: number, height: number) => void;
  scrollViewRef?: React.RefObject<ScrollView | null>;
  isLoading?: boolean;
  onFuelTypeChange?: (fuelType: string) => void;
  onSelectSort?: (sort: 'mais_caro' | 'mais_barato' | 'mais_longe' | 'mais_perto') => void;
  selectedSort?: 'mais_caro' | 'mais_barato' | 'mais_longe' | 'mais_perto';
};

const StationList: React.FC<StationListProps> = ({
  stations,
  userLocation,
  selectedFuelType,
  selectedStation,
  preferredNavigationApp,
  onScroll,
  onMeasureCardHeight,
  scrollViewRef,
  isLoading = false,
  onFuelTypeChange,
  onSelectSort,
  selectedSort,
}) => {
  const { theme } = useAppContext();
  const dimensions = Dimensions.get('window');
  const isPortrait = dimensions.height >= dimensions.width;

  if (isLoading) {
    return (
      <View style={{ backgroundColor: theme.background }} className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ color: theme.textSecondary }} className="mt-4">
          Loading stations...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ backgroundColor: theme.background, flex: 1 }}>
      {onFuelTypeChange && onSelectSort && selectedSort && (
        <FuelTypeSelector
          selectedFuelType={selectedFuelType}
          onFuelTypeChange={onFuelTypeChange}
          selectedSort={selectedSort}
          onSelectSort={onSelectSort}
        />
      )}
      <ScrollView
        ref={scrollViewRef}
        style={{ 
          backgroundColor: theme.background,
          flex: 1
        }}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {stations.length === 0 ? (
          <View style={{ 
            flex: 1, 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: 16,
            backgroundColor: theme.background
          }}>
            <Ionicons name="alert-circle-outline" size={48} color={theme.textSecondary} />
            <Text style={{ 
              color: theme.textSecondary,
              marginTop: 16,
              textAlign: 'center'
            }}>
              No stations found in your area
            </Text>
          </View>
        ) : (
          stations.map((station, index) => (
            <View
              key={station.id}
              style={{ backgroundColor: theme.background }}
              onLayout={(event) => {
                if (onMeasureCardHeight) {
                  onMeasureCardHeight(index, event.nativeEvent.layout.height);
                }
              }}
            >
              <PostoCard
                station={station}
                userLocation={userLocation}
                selectedFuelType={selectedFuelType}
                isSelected={selectedStation?.id === station.id}
                preferredNavigationApp={preferredNavigationApp}
              />
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

export default StationList; 