import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useAppContext } from '../context/AppContext';
import { useAppTranslation } from '../i18n';

const sortOptions = [
  { id: 'mais_barato', icon: 'trending-down' },
  { id: 'mais_caro', icon: 'trending-up' },
  { id: 'mais_perto', icon: 'location' },
  { id: 'mais_longe', icon: 'location-outline' },
];

type FuelTypeSelectorProps = {
  selectedFuelType: string;
  onFuelTypeChange: (fuelType: string) => void;
  selectedSort?: 'mais_caro' | 'mais_barato' | 'mais_longe' | 'mais_perto';
  onSelectSort?: (sort: 'mais_caro' | 'mais_barato' | 'mais_longe' | 'mais_perto') => void;
};

const FuelTypeSelector: React.FC<FuelTypeSelectorProps> = (props) => {
  const { selectedFuelType, onFuelTypeChange, selectedSort = 'mais_barato', onSelectSort } = props;
  const { selectedFuelTypes, theme, availableFuelTypes } = useAppContext();
  const { t } = useAppTranslation();
  const scrollRef = useRef<ScrollView>(null);

  // Get only the fuel types that are selected in settings
  const fuelTypes = useMemo(() => {
    // Build a list of objects with id and a best-effort icon using local mapping
    const iconById: Record<string, any> = {
      'Gasóleo simples': 'water',
      'Gasóleo especial': 'water-outline',
      'Gasolina simples 95': 'speedometer',
      'Gasolina especial 95': 'speedometer-outline',
      'Gasolina 98': 'flame',
      'Gasolina especial 98': 'flame-outline',
      'Biodiesel B15': 'flash',
      'GPL Auto': 'flash-outline',
    };
    return (availableFuelTypes.length ? availableFuelTypes : selectedFuelTypes)
      .filter((id) => selectedFuelTypes.includes(id))
      .map((id) => ({ id, icon: iconById[id] || 'water' }));
  }, [availableFuelTypes, selectedFuelTypes]);

  // Ensure selectedFuelType is valid
  useEffect(() => {
    if (!selectedFuelTypes.includes(selectedFuelType)) {
      onFuelTypeChange(selectedFuelTypes[0] || '');
    }
  }, [selectedFuelTypes, selectedFuelType, onFuelTypeChange]);

  const handleSortPress = () => {
    if (!onSelectSort) return;
    
    const currentIndex = sortOptions.findIndex(opt => opt.id === selectedSort);
    const nextIndex = (currentIndex + 1) % sortOptions.length;
    onSelectSort(sortOptions[nextIndex].id as any);
  };

  const scrollBy = (deltaX: number) => {
    try {
      (scrollRef.current as any)?.scrollTo({ x: Math.max(0, (scrollRef.current as any)?._lastX || 0) + deltaX, animated: true });
      (scrollRef.current as any)._lastX = ((scrollRef.current as any)?._lastX || 0) + deltaX;
    } catch {}
  };

  return (
    <View style={{ backgroundColor: theme.background }} className="flex-row items-center px-4 py-1">
      {/* Sort Icon Button */}
      {onSelectSort && (
        <TouchableOpacity
          onPress={handleSortPress}
          style={{ backgroundColor: theme.card }}
          className="items-center justify-center w-9 h-9 rounded-full mr-2"
          accessibilityLabel={t(`station.sortBy.${selectedSort}`)}
        >
          <Ionicons
            name={sortOptions.find(opt => opt.id === selectedSort)?.icon as any}
            size={22}
            color={theme.primary}
          />
        </TouchableOpacity>
      )}
      {/* Left chevron */}
      <TouchableOpacity
        onPress={() => scrollBy(-160)}
        style={{ backgroundColor: theme.card }}
        className="items-center justify-center w-8 h-8 rounded-full mr-2"
        accessibilityLabel={t('station.sortBy.mais_barato')}
      >
        <Ionicons name="chevron-back" size={18} color={theme.primary} />
      </TouchableOpacity>
      {/* Fuel Types ScrollView */}
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        className="flex-1"
      >
        {fuelTypes.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={{
              backgroundColor: selectedFuelType === type.id ? theme.primary : theme.card
            }}
            className="mr-2 mb-2 p-2 px-4 rounded-lg"
            onPress={() => onFuelTypeChange(type.id)}
          >
            <View className="flex-row items-center">
              <Ionicons
                name={type.icon as any}
                size={20}
                color={selectedFuelType === type.id ? '#ffffff' : theme.textSecondary}
              />
              <Text
                style={{
                  color: selectedFuelType === type.id ? '#ffffff' : theme.text
                }}
                className="ml-2"
              >
                {t(`station.fuelType.${type.id}`)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {/* Right chevron */}
      <TouchableOpacity
        onPress={() => scrollBy(160)}
        style={{ backgroundColor: theme.card }}
        className="items-center justify-center w-8 h-8 rounded-full ml-2"
      >
        <Ionicons name="chevron-forward" size={18} color={theme.primary} />
      </TouchableOpacity>
    </View>
  );
};

export default FuelTypeSelector;