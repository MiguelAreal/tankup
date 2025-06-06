import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useAppContext } from '../../context/AppContext';
import { Strings } from '../../types/strings';
import fuelTypesData from '../assets/fuelTypes.json';
import stringsEN from '../assets/strings.en.json';
import stringsPT from '../assets/strings.pt.json';

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

const FuelTypeSelector: React.FC<FuelTypeSelectorProps> = ({
  selectedFuelType,
  onFuelTypeChange,
  selectedSort = 'mais_barato',
  onSelectSort,
}) => {
  const { language, selectedFuelTypes, theme } = useAppContext();
  const strings = (language === 'en' ? stringsEN : stringsPT) as Strings;

  // Filter fuel types based on selected types and ensure they exist in the strings
  const fuelTypes = fuelTypesData.types.filter(type => 
    selectedFuelTypes.includes(type.id) && 
    type.id in strings.station.fuelType
  );

  const handleSortPress = () => {
    if (!onSelectSort) return;
    
    const currentIndex = sortOptions.findIndex(opt => opt.id === selectedSort);
    const nextIndex = (currentIndex + 1) % sortOptions.length;
    onSelectSort(sortOptions[nextIndex].id as any);
  };

  return (
    <View style={{ backgroundColor: theme.background }} className="flex-row items-center px-4 py-1">
      {/* Sort Icon Button */}
      {onSelectSort && (
        <TouchableOpacity
          onPress={handleSortPress}
          style={{ backgroundColor: theme.card }}
          className="items-center justify-center w-9 h-9 rounded-full mr-2"
          accessibilityLabel={strings.station.sortBy[selectedSort]}
        >
          <Ionicons
            name={sortOptions.find(opt => opt.id === selectedSort)?.icon as any}
            size={22}
            color={theme.primary}
          />
        </TouchableOpacity>
      )}
      {/* Fuel Types ScrollView */}
      <ScrollView
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
                {strings.station.fuelType[type.id as keyof typeof strings.station.fuelType]}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default FuelTypeSelector;