import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import StationCard from './components/StationCard';
import FuelTypeSelector from './components/FuelTypeSelector';

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

export default function FavoritesScreen() {
  const router = useRouter();
  const [favoriteStations, setFavoriteStations] = useState<Station[]>([]);
  const [selectedFuelType, setSelectedFuelType] = useState('diesel');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        setLoading(true);
        const favoritesJson = await AsyncStorage.getItem('favoriteStations');
        if (favoritesJson) {
          const favorites = JSON.parse(favoritesJson);
          setFavoriteStations(favorites);
        }
      } catch (error) {
        console.error('Error loading favorites:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadFavorites();
  }, []);
  
  const removeFavorite = async (stationId: string) => {
    try {
      const updatedFavorites = favoriteStations.filter(station => station.id !== stationId);
      setFavoriteStations(updatedFavorites);
      await AsyncStorage.setItem('favoriteStations', JSON.stringify(updatedFavorites));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };
  
  // Sort stations by price for the selected fuel type
  const sortedStations = [...favoriteStations].sort((a, b) => {
    const aPrice = a.fuels.find(fuel => fuel.type === selectedFuelType)?.price || 0;
    const bPrice = b.fuels.find(fuel => fuel.type === selectedFuelType)?.price || 0;
    return aPrice - bPrice;
  });
  
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
            Postos Favoritos
          </Text>
          
          {/* Fuel Type Selector */}
          <FuelTypeSelector 
            selectedFuelType={selectedFuelType} 
            onSelectFuelType={setSelectedFuelType} 
          />
          
          {/* Favorites List */}
          {loading ? (
            <View className="items-center justify-center p-8">
              <Text className="text-slate-600 dark:text-slate-400">A carregar favoritos...</Text>
            </View>
          ) : sortedStations.length > 0 ? (
            <View className="mt-4">
              {sortedStations.map((station) => (
                <View key={station.id} className="mb-4">
                  <StationCard
                    station={station}
                    selectedFuelType={selectedFuelType}
                    showFavoriteButton={false}
                  />
                  <TouchableOpacity
                    className="bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-lg mt-1 py-2 flex-row justify-center items-center"
                    onPress={() => removeFavorite(station.id)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    <Text className="ml-1 text-red-600 dark:text-red-400 font-medium">Remover dos favoritos</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <View className="mt-6 items-center justify-center p-8 bg-white dark:bg-slate-800 rounded-lg">
              <Ionicons name="heart-outline" size={48} color="#94a3b8" />
              <Text className="text-center mt-4 text-lg font-medium text-slate-700 dark:text-slate-300">
                Sem postos favoritos
              </Text>
              <Text className="text-center mt-2 text-slate-600 dark:text-slate-400">
                Adicione postos aos favoritos clicando no ícone de coração na lista de postos.
              </Text>
              <TouchableOpacity
                className="mt-6 bg-blue-600 dark:bg-blue-500 rounded-lg px-6 py-3"
                onPress={() => router.push('/')}
              >
                <Text className="text-white font-medium">Procurar Postos</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}