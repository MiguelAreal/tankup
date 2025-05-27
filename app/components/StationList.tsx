import React from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { Posto } from '../../types/models';
import PostoCard from './PostoCard';

interface StationListProps {
  stations: Posto[];
  userLocation: { latitude: number; longitude: number };
  selectedFuelType: string;
  selectedStation: Posto | null;
  onScroll: (event: any) => void;
  onMeasureCardHeight: (index: number, height: number) => void;
  scrollViewRef: React.RefObject<ScrollView | null>;
  isLoading?: boolean;
}

const StationList: React.FC<StationListProps> = ({
  stations,
  userLocation,
  selectedFuelType,
  selectedStation,
  onScroll,
  onMeasureCardHeight,
  scrollViewRef,
  isLoading = false,
}) => {
  return (
    <View className="flex-1 bg-white dark:bg-slate-900 rounded-t-3xl space-y-4">
      <ScrollView 
        ref={scrollViewRef}
        className="px-4 pb-4"
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        <View>
          {isLoading && stations.length === 0 ? (
            <View className="py-8 items-center">
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text className="mt-4 text-slate-600 dark:text-slate-400">
                Loading stations...
              </Text>
            </View>
          ) : (
            stations.map((station, index) => (
              <View
                key={station.id}
                onLayout={(event) => onMeasureCardHeight(index, event.nativeEvent.layout.height)}
              >
                <PostoCard
                  station={station}
                  userLocation={userLocation}
                  selectedFuelType={selectedFuelType}
                  isSelected={selectedStation?.id === station.id}
                />
              </View>
            ))
          )}
          
          {/* Loading indicator at the bottom when we have existing stations */}
          {isLoading && stations.length > 0 && (
            <View className="py-4 items-center">
              <ActivityIndicator size="small" color="#3b82f6" />
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default StationList; 