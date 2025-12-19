import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, Text, TouchableOpacity, View } from 'react-native';

// Context & Types
import { PostoSortOption, SORT_OPTIONS_LIST } from '@/types/models/PostoSortOption';
import { useAppContext } from '../context/AppContext';

// --- Constants (Static Data) ---

// Mapeamento de Ícones de Ordenação
const SORT_ICONS: Record<PostoSortOption, keyof typeof Ionicons.glyphMap> = {
  'mais_barato': 'trending-down',
  'mais_caro': 'trending-up',
  'mais_perto': 'location',
  'mais_longe': 'location-outline',
};

// Mapeamento de Ícones de Combustível (Fallback se não vier da API)
const FUEL_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'Gasóleo simples': 'water',
  'Gasóleo especial': 'water-outline',
  'Gasolina simples 95': 'speedometer',
  'Gasolina especial 95': 'speedometer-outline',
  'Gasolina 98': 'flame',
  'Gasolina especial 98': 'flame-outline',
  'Biodiesel B15': 'flash',
  'GPL Auto': 'flash-outline',
};

type FuelTypeSelectorProps = {
  selectedFuelType: string;
  onFuelTypeChange: (fuelType: string) => void;
  selectedSort?: PostoSortOption;
  onSelectSort?: (sort: PostoSortOption) => void;
};

const FuelTypeSelector: React.FC<FuelTypeSelectorProps> = ({
  selectedFuelType,
  onFuelTypeChange,
  selectedSort = 'mais_barato',
  onSelectSort,
}) => {
  const { t } = useTranslation();
  const { selectedFuelTypes, theme, availableFuelTypes } = useAppContext();
  
  const scrollRef = useRef<ScrollView>(null);
  const currentScrollX = useRef(0); // Rastreio manual da posição do scroll sem re-renders

  // Memoize fuel types list processing
  const displayFuelTypes = useMemo(() => {
    const sourceList = availableFuelTypes.length ? availableFuelTypes : selectedFuelTypes;
    
    return sourceList
      .filter((id) => selectedFuelTypes.includes(id))
      .map((id) => ({
        id,
        icon: FUEL_ICONS[id] || 'water'
      }));
  }, [availableFuelTypes, selectedFuelTypes]);

  // Validate selected fuel type availability
  useEffect(() => {
    if (selectedFuelTypes.length > 0 && !selectedFuelTypes.includes(selectedFuelType)) {
      onFuelTypeChange(selectedFuelTypes[0]);
    }
  }, [selectedFuelTypes, selectedFuelType, onFuelTypeChange]);

  // Handle Sort Cycle
  const handleSortPress = () => {
    if (!onSelectSort) return;
    
    const currentIndex = SORT_OPTIONS_LIST.indexOf(selectedSort);
    const nextIndex = (currentIndex + 1) % SORT_OPTIONS_LIST.length;
    
    onSelectSort(SORT_OPTIONS_LIST[nextIndex]);
  };

  // Safe Scroll Logic
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    currentScrollX.current = event.nativeEvent.contentOffset.x;
  };

  const scrollBy = (deltaX: number) => {
    const newX = Math.max(0, currentScrollX.current + deltaX);
    scrollRef.current?.scrollTo({ x: newX, animated: true });
  };

  return (
    <View style={{ backgroundColor: theme.background }} className="flex-row items-center px-4 py-1">
      
      {/* 1. Sort Button */}
      {onSelectSort && (
        <TouchableOpacity
          onPress={handleSortPress}
          style={{ backgroundColor: theme.card }}
          className="items-center justify-center w-9 h-9 rounded-full mr-2 shadow-sm"
          accessibilityLabel={t(`station.sortBy.${selectedSort}`)}
        >
          <Ionicons
            name={SORT_ICONS[selectedSort]}
            size={22}
            color={theme.primary}
          />
        </TouchableOpacity>
      )}

      {/* 2. Left Chevron */}
      <TouchableOpacity
        onPress={() => scrollBy(-160)}
        style={{ backgroundColor: theme.card }}
        className="items-center justify-center w-8 h-8 rounded-full mr-2 shadow-sm"
      >
        <Ionicons name="chevron-back" size={18} color={theme.primary} />
      </TouchableOpacity>

      {/* 3. Fuel Types List */}
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        className="flex-1"
        onScroll={handleScroll}
        scrollEventThrottle={16} // Otimiza performance do evento de scroll
      >
        {displayFuelTypes.map((type) => {
          const isSelected = selectedFuelType === type.id;
          return (
            <TouchableOpacity
              key={type.id}
              style={{
                backgroundColor: isSelected ? theme.primary : theme.card
              }}
              className="mr-2 mb-2 p-2 px-4 rounded-lg flex-row items-center shadow-sm"
              onPress={() => onFuelTypeChange(type.id)}
            >
              <Ionicons
                name={type.icon}
                size={20}
                color={isSelected ? '#ffffff' : theme.textSecondary}
              />
              <Text
                style={{ color: isSelected ? '#ffffff' : theme.text }}
                className="ml-2 font-medium"
              >
                {t(`station.fuelType.${type.id}`, { defaultValue: type.id })}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* 4. Right Chevron */}
      <TouchableOpacity
        onPress={() => scrollBy(160)}
        style={{ backgroundColor: theme.card }}
        className="items-center justify-center w-8 h-8 rounded-full ml-2 shadow-sm"
      >
        <Ionicons name="chevron-forward" size={18} color={theme.primary} />
      </TouchableOpacity>
    </View>
  );
};

export default FuelTypeSelector;