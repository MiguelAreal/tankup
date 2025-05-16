import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import FuelTypeSelector from './components/FuelTypeSelector';
import StationCard from './components/StationCard';
import { fetchStationsByLocation } from './utils/api';

// Portugal districts data
const districts = [
  'Aveiro', 'Beja', 'Braga', 'Bragança', 'Castelo Branco', 'Coimbra', 'Évora', 
  'Faro', 'Guarda', 'Leiria', 'Lisboa', 'Portalegre', 'Porto', 'Santarém', 
  'Setúbal', 'Viana do Castelo', 'Vila Real', 'Viseu', 'Açores', 'Madeira'
];

// Example counties (would be dynamic based on selected district)
const countiesByDistrict: Record<string, string[]> = {
  'Lisboa': ['Amadora', 'Cascais', 'Lisboa', 'Loures', 'Odivelas', 'Oeiras', 'Sintra'],
  'Porto': ['Gondomar', 'Maia', 'Matosinhos', 'Porto', 'Póvoa de Varzim', 'Vila do Conde', 'Vila Nova de Gaia'],
  // Add other districts as needed
};

// Station type definition
type Station = {
  id: string;
  name: string;
  brand: string;
  address: string;
  distance: number;
  latitude: number;
  longitude: number;
  fuels: {
    type: string;
    price: number;
  }[];
};

export default function SearchScreen() {
  const router = useRouter();
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedCounty, setSelectedCounty] = useState('');
  const [selectedFuelType, setSelectedFuelType] = useState('diesel');
  const [loading, setLoading] = useState(false);
  const [stations, setStations] = useState<Station[]>([]);
  
  // Get counties for selected district
  const counties = selectedDistrict ? (countiesByDistrict[selectedDistrict] || []) : [];
  
  // Handle search
  const handleSearch = async () => {
    if (!selectedDistrict || !selectedCounty) {
      return;
    }
    
    setLoading(true);
    try {
      const result = await fetchStationsByLocation(selectedDistrict, selectedCounty, selectedFuelType);
      setStations(Array.isArray(result) ? result as Station[] : []);
    } catch (error) {
      console.error('Error fetching stations:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Sort stations by price
  const sortedStations = [...stations].sort((a, b) => {
    const aPrice = a.fuels.find(fuel => fuel.type === selectedFuelType)?.price || 0;
    const bPrice = b.fuels.find(fuel => fuel.type === selectedFuelType)?.price || 0;
    return aPrice - bPrice;
  });
  
  // Just get the top 10 stations
  const topStations = sortedStations.slice(0, 10);
  
  return (
    <SafeAreaView className="flex-1 bg-slate-100 dark:bg-slate-900">
      <ScrollView className="flex-1">
        {/* Back button */}
        <View className="px-4 py-2">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="flex-row items-center"
          >
            <Ionicons name="arrow-back" size={24} color="#2563eb" />
            <Text className="ml-2 text-blue-600 dark:text-blue-400 font-medium">Voltar</Text>
          </TouchableOpacity>
        </View>
        
        <View className="p-4">
          <Text className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-200">
            Pesquisar por localização
          </Text>
          
          {/* Fuel Type Selector */}
          <FuelTypeSelector 
            selectedFuelType={selectedFuelType} 
            onSelectFuelType={setSelectedFuelType} 
          />
          
          {/* District Selector */}
          <View className="mb-4 bg-white dark:bg-slate-800 rounded-lg overflow-hidden">
            <Text className="px-4 pt-2 text-slate-600 dark:text-slate-400">
              Distrito
            </Text>
            <View className="border border-slate-200 dark:border-slate-700 rounded-lg">
              <Picker
                selectedValue={selectedDistrict}
                onValueChange={(itemValue) => {
                  setSelectedDistrict(itemValue);
                  setSelectedCounty('');
                }}
                style={{ 
                  backgroundColor: 'transparent',
                  color: '#1e293b',
                }}
              >
                <Picker.Item label="Selecionar distrito" value="" />
                {districts.map((district) => (
                  <Picker.Item key={district} label={district} value={district} />
                ))}
              </Picker>
            </View>
          </View>
          
          {/* County Selector (enabled only if district is selected) */}
          <View className={`mb-4 bg-white dark:bg-slate-800 rounded-lg overflow-hidden ${!selectedDistrict ? 'opacity-50' : ''}`}>
            <Text className="px-4 pt-2 text-slate-600 dark:text-slate-400">
              Concelho
            </Text>
            <View className="border border-slate-200 dark:border-slate-700 rounded-lg">
              <Picker
                selectedValue={selectedCounty}
                onValueChange={setSelectedCounty}
                enabled={!!selectedDistrict}
                style={{ 
                  backgroundColor: 'transparent',
                  color: '#1e293b',
                }}
              >
                <Picker.Item label="Selecionar concelho" value="" />
                {counties.map((county) => (
                  <Picker.Item key={county} label={county} value={county} />
                ))}
              </Picker>
            </View>
          </View>
          
          {/* Search Button */}
          <TouchableOpacity
            className={`py-4 rounded-lg flex-row justify-center items-center ${
              (!selectedDistrict || !selectedCounty)
                ? 'bg-blue-300 dark:bg-blue-900'
                : 'bg-blue-600 dark:bg-blue-500'
            }`}
            onPress={handleSearch}
            disabled={!selectedDistrict || !selectedCounty || loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <Ionicons name="search" size={20} color="#ffffff" />
                <Text className="ml-2 text-white font-medium">Pesquisar</Text>
              </>
            )}
          </TouchableOpacity>
          
          {/* Results */}
          {topStations.length > 0 && (
            <View className="mt-6">
              <Text className="text-lg font-semibold mb-2 text-slate-800 dark:text-slate-200">
                Resultados:
              </Text>
              
              {topStations.map((station) => (
                <StationCard
                  key={station.id}
                  station={station}
                  selectedFuelType={selectedFuelType}
                />
              ))}
            </View>
          )}
          
          {/* No results message */}
          {!loading && stations.length === 0 && selectedDistrict && selectedCounty && (
            <View className="mt-6 items-center justify-center p-4 bg-white dark:bg-slate-800 rounded-lg">
              <Ionicons name="information-circle-outline" size={36} color="#94a3b8" />
              <Text className="text-center mt-2 text-slate-600 dark:text-slate-400">
                Não foram encontrados postos nesta localização.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}