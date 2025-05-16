import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

// Fuel type definitions with icons and label
const fuelTypes = [
  {
    id: 'diesel',
    label: 'Gasóleo',
    icon: 'water',
  },
  {
    id: 'diesel_special',
    label: 'Gasóleo +',
    icon: 'water-outline',
  },
  {
    id: 'gasoline_95',
    label: 'Gasolina 95',
    icon: 'speedometer',
  },
  {
    id: 'gasoline_98',
    label: 'Gasolina 98',
    icon: 'speedometer-outline',
  },
  {
    id: 'gpl',
    label: 'GPL',
    icon: 'flame',
  },
];

type FuelTypeSelectorProps = {
  selectedFuelType: string;
  onSelectFuelType: (fuelType: string) => void;
};

const FuelTypeSelector: React.FC<FuelTypeSelectorProps> = ({
  selectedFuelType,
  onSelectFuelType,
}) => {
  return (
    <View className="mb-2 mt-2">
      <ScrollView 
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 4 }}
      >
        {fuelTypes.map((fuel) => (
          <TouchableOpacity
            key={fuel.id}
            className={`mr-2 px-4 py-3 rounded-lg flex-row items-center ${
              selectedFuelType === fuel.id
                ? 'bg-blue-600 dark:bg-blue-500'
                : 'bg-white dark:bg-slate-800'
            }`}
            onPress={() => onSelectFuelType(fuel.id)}
          >
            <Ionicons 
              name={fuel.icon as any} 
              size={18} 
              color={selectedFuelType === fuel.id ? '#ffffff' : '#64748b'} 
            />
            <Text 
              className={`ml-2 font-medium ${
                selectedFuelType === fuel.id
                  ? 'text-white'
                  : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              {fuel.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default FuelTypeSelector;