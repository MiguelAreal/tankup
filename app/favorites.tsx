import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { useAppContext } from '../context/AppContext';
import { Posto } from '../types/models';
import PostoCard from './components/PostoCard';
import { getFavorites } from './utils/storage';

export default function FavoritesScreen() {
  const router = useRouter();
  const { theme, darkMode } = useAppContext();
  const [favorites, setFavorites] = useState<Posto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState({ latitude: 0, longitude: 0 });

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const savedFavorites = await getFavorites();
      setFavorites(savedFavorites);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackPress = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <>
        <StatusBar 
          barStyle={darkMode ? 'light-content' : 'dark-content'}
          translucent={true}
          backgroundColor="transparent"
        />
        <SafeAreaView 
          className="flex-1 justify-center items-center"
          style={{ 
            paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
            backgroundColor: theme.background
          }}
        >
          <ActivityIndicator size="large" color={theme.primary} />
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <StatusBar 
        barStyle={darkMode ? 'light-content' : 'dark-content'}
        translucent={true}
        backgroundColor="transparent"
      />
      <SafeAreaView 
        className="flex-1"
        style={{ 
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
          backgroundColor: theme.background
        }}
      >
        {/* Header */}
        <View style={{ backgroundColor: theme.background }} className="px-4 py-2 flex-row items-center">
          <TouchableOpacity 
            onPress={handleBackPress}
            className="flex-row items-center"
          >
            <Ionicons name="arrow-back" size={24} color={theme.primary} />
            <Text style={{ color: theme.primary }} className="ml-2 text-xl font-semibold">
              Favorites
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView 
          style={{ backgroundColor: theme.background }}
          className="flex-1 px-4"
        >
          {favorites.length === 0 ? (
            <View className="flex-1 items-center justify-center p-4">
              <Ionicons name="heart-outline" size={48} color={theme.textSecondary} />
              <Text style={{ color: theme.textSecondary }} className="mt-4 text-center text-lg">
                No favorites yet
              </Text>
              <Text style={{ color: theme.textSecondary }} className="mt-2 text-center">
                Add stations to your favorites to see them here
              </Text>
            </View>
          ) : (
            favorites.map((station) => (
              <PostoCard
                key={station.id}
                station={station}
                userLocation={userLocation}
                selectedFuelType={station.combustiveis[0]?.tipo || ''}
                isSelected={false}
              />
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}