import { Ionicons } from '@expo/vector-icons';
import { Href, useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { Posto } from '../../types/models/Posto'; // Ajuste o caminho conforme a sua estrutura
import { PostoSortOption } from '../../types/models/PostoSortOption';
import { useAppContext } from '../context/AppContext';
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
  onSelectSort?: (sort: PostoSortOption) => void;
  selectedSort?: PostoSortOption;
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
  const router = useRouter();

  // Handler para navegar para o detalhe
  const handleStationPress = useCallback((station: Posto) => {
    const stationData = encodeURIComponent(JSON.stringify(station));
    router.push(`/station/${station.id}?stationData=${stationData}`);
  }, [router]);

  if (isLoading) {
    return (
      <View style={{ backgroundColor: theme.background }} className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ color: theme.textSecondary }} className="mt-4">
          A carregar postos...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ backgroundColor: theme.background, flex: 1 }}>
      {/* Selector e Filtros */}
      {onFuelTypeChange && onSelectSort && selectedSort && (
        <View style={{ zIndex: 10 }}>
            <FuelTypeSelector
            selectedFuelType={selectedFuelType}
            onFuelTypeChange={onFuelTypeChange}
            selectedSort={selectedSort}
            onSelectSort={onSelectSort}
            />
        </View>
      )}

      {/* Lista de Postos */}
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ 
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 32
        }}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {stations.length === 0 ? (
          <View style={{ 
            flex: 1, 
            alignItems: 'center', 
            justifyContent: 'center', 
            marginTop: 60
          }}>
            <Ionicons name="alert-circle-outline" size={48} color={theme.textSecondary} />
            <Text style={{ 
              color: theme.textSecondary,
              marginTop: 16,
              textAlign: 'center'
            }}>
              Não foram encontrados postos nesta área.
            </Text>
          </View>
        ) : (
          stations.map((station, index) => (
            <View
              key={station.id}
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
                onPress={handleStationPress} // Passamos o handler aqui
              />
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

export default StationList;