import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { AppContext } from '../context/AppContext';
import stringsEN from './assets/strings.en.json';
import stringsPT from './assets/strings.pt.json';
import { Station } from './components/Map/Map.types';
import StationCard from './components/StationCard';
import { Strings } from './types/strings';

export default function FavoritesScreen() {
  const router = useRouter();
  const { language, darkMode } = useContext(AppContext);
  const strings = (language === 'en' ? stringsEN : stringsPT) as Strings;
  const [favorites, setFavorites] = useState<Station[]>([]);

  // Apply dark mode class to html element
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const html = document.documentElement;
      if (darkMode) {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }
    }
  }, [darkMode]);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const favoritesJson = await AsyncStorage.getItem('favoriteStations');
      if (favoritesJson) {
        setFavorites(JSON.parse(favoritesJson));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const handleBackPress = () => {
    router.replace('/');
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-100 dark:bg-slate-900">
      {/* Header */}
      <View className="px-4 py-2">
        <TouchableOpacity 
          onPress={handleBackPress}
          className="flex-row items-center"
        >
          <Ionicons name="arrow-back" size={24} color="#2563eb" />
          <Text className="ml-2 text-xl font-semibold text-blue-600 dark:text-blue-400">
            {strings.favorites.title}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView className="flex-1 px-4">
        {favorites.length > 0 ? (
          favorites.map((station) => (
            <StationCard
              key={station.id}
              station={station}
              selectedFuelType="diesel"
              showFavoriteButton={true}
            />
          ))
        ) : (
          <View className="items-center justify-center py-10">
            <Ionicons name="heart-outline" size={48} color="#64748b" />
            <Text className="mt-4 text-slate-600 dark:text-slate-400 text-center">
              {strings.favorites.empty}
            </Text>
            <Text className="mt-2 text-slate-500 dark:text-slate-500 text-center">
              {strings.favorites.addHint}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}