import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useAppContext } from '../context/AppContext';
import { Posto } from '../types/models/Posto';
import { Strings } from '../types/strings';
import stringsEN from './assets/strings.en.json';
import stringsPT from './assets/strings.pt.json';
import PostoCard from './components/PostoCard';
import ResponsiveAdBanner from './components/ResponsiveAdBanner';

export default function FavoritesScreen() {
  const router = useRouter();
  const { language, darkMode, selectedFuelTypes } = useAppContext();
  const strings = (language === 'en' ? stringsEN : stringsPT) as Strings;
  const [favorites, setFavorites] = useState<Posto[]>([]);
  const [selectedFuelType, setSelectedFuelType] = useState(selectedFuelTypes[0] || 'Gasóleo simples');

  // Update selectedFuelType when selectedFuelTypes changes
  useEffect(() => {
    if (selectedFuelTypes.length > 0 && !selectedFuelTypes.includes(selectedFuelType)) {
      setSelectedFuelType(selectedFuelTypes[0]);
    }
  }, [selectedFuelTypes]);

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
    const loadFavorites = async () => {
      try {
        const favorites = await AsyncStorage.getItem('favoriteStations');
        if (favorites) {
          setFavorites(JSON.parse(favorites));
        }
      } catch (error) {
        // Silent error handling
      }
    };
    loadFavorites();
  }, []);

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
          <>
            {favorites.map((station) => (
              <PostoCard
                key={station.id}
                station={station}
                selectedFuelType={selectedFuelType}
                userLocation={{ latitude: 38.736946, longitude: -9.142685 }}
              />
            ))}
            <ResponsiveAdBanner testID="favoritesScreenBanner" />
          </>
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