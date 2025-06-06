import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
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
  const { language, selectedFuelTypes } = useAppContext();
  const strings = (language === 'en' ? stringsEN : stringsPT) as Strings;
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  // Filter fuel types based on selected types and ensure they exist in the strings
  const fuelTypes = fuelTypesData.types.filter(type => 
    selectedFuelTypes.includes(type.id) && 
    type.id in strings.station.fuelType
  );

  return (
    <View className="flex-row items-center px-4 py-1">
      {/* Sort Icon Button */}
      {onSelectSort && (
        <View className="mr-2">
          <TouchableOpacity
            onPress={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
            className="items-center justify-center w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700"
            accessibilityLabel={strings.station.sortBy[selectedSort]}
          >
            <Ionicons
              name={sortOptions.find(opt => opt.id === selectedSort)?.icon as any}
              size={22}
              color="#2563eb"
            />
          </TouchableOpacity>
          {/* Dropdown menu */}
          {isSortDropdownOpen && (
            <View className="absolute z-50 mt-2 left-0 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 min-w-[160px]">
              {sortOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  className={`flex-row items-center px-3 py-2 ${
                    selectedSort === option.id
                      ? 'bg-blue-50 dark:bg-blue-900/30'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                  onPress={() => {
                    onSelectSort(option.id as any);
                    setTimeout(() => setIsSortDropdownOpen(false), 100);
                  }}
                >
                  <Ionicons
                    name={option.icon as any}
                    size={18}
                    color={selectedSort === option.id ? '#2563eb' : '#64748b'}
                  />
                  <Text
                    className={`ml-2 text-sm ${
                      selectedSort === option.id
                        ? 'text-blue-600 dark:text-blue-400 font-medium'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {strings.station.sortBy[option.id as keyof typeof strings.station.sortBy]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
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
            className={`mr-2 mb-2 p-2 px-4 rounded-lg ${
              selectedFuelType === type.id
                ? 'bg-blue-600'
                : 'bg-slate-200 dark:bg-slate-700'
            }`}
            onPress={() => onFuelTypeChange(type.id)}
          >
            <View className="flex-row items-center">
              <Ionicons
                name={type.icon as any}
                size={20}
                color={selectedFuelType === type.id ? '#ffffff' : '#64748b'}
              />
              <Text
                className={`ml-2 ${
                  selectedFuelType === type.id
                    ? 'text-white font-medium'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
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