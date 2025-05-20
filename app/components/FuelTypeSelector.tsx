import { Ionicons } from '@expo/vector-icons';
import React, { useContext } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { AppContext } from '../../context/AppContext';
import stringsEN from '../assets/strings.en.json';
import stringsPT from '../assets/strings.pt.json';
import { Strings } from '../types/strings';

// Fuel type definitions with icons
const fuelTypes = [
  {
    id: 'Gasóleo simples',
    icon: 'water',
  },
  {
    id: 'Gasóleo especial',
    icon: 'water-outline',
  },
  {
    id: 'Gasolina simples 95',
    icon: 'speedometer',
  },
  {
    id: 'Gasolina especial 95',
    icon: 'speedometer-outline',
  },
  {
    id: 'Gasolina 98',
    icon: 'flame',
  },
  {
    id: 'Biodiesel B15',
    icon: 'flash',
  },
  {
    id: 'GPL Auto',
    icon: 'flash',
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
  const { language } = useContext(AppContext);
  const strings = (language === 'en' ? stringsEN : stringsPT) as Strings;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="px-4 py-1"
    >
      {fuelTypes.map((type) => (
        <TouchableOpacity
          key={type.id}
          className={`mr-2 mb-2 p-2 px-4 rounded-lg ${
            selectedFuelType === type.id
              ? 'bg-blue-600'
              : 'bg-slate-200 dark:bg-slate-700'
          }`}
          onPress={() => onSelectFuelType(type.id)}
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
  );
};

export default FuelTypeSelector;