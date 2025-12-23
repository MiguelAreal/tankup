import * as Location from 'expo-location';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Platform, SafeAreaView, StatusBar, View } from 'react-native';

// Services & Types
import { Posto } from './../types/models/Posto';
import { useAppContext } from './context/AppContext';
import { getFavorites } from './utils/storage';

// Components
import PostoCard from './components/PostoCard';
import { EmptyFavorites, FavoritesHeader } from './components/favorites';

export default function FavoritesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { theme, darkMode, preferredNavigationApp } = useAppContext();
  
  // State
  const [favorites, setFavorites] = useState<Posto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState({ latitude: 0, longitude: 0 });

  // Load Data on Focus
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadData = async () => {
        try {
          const [savedFavorites, location] = await Promise.all([
            getFavorites(),
            Location.getLastKnownPositionAsync().catch(() => null)
          ]);
          
          if (isActive) {
            setFavorites(savedFavorites);
            if (location) setUserLocation(location.coords);
          }
        } catch (error) {
          console.error('Error loading data:', error);
        } finally {
          if (isActive) setIsLoading(false);
        }
      };

      loadData();
      return () => { isActive = false; };
    }, [])
  );

  // --- 1. Handler para Navegação (Copiado da lógica da StationList) ---
  const handleStationPress = useCallback((station: Posto) => {
    router.push({
      pathname: '/station/[id]',
      params: { 
        id: station.id, 
        stationData: JSON.stringify(station) 
      }
    } as any); // 'as any' para contornar o problema temporário de tipagem
  }, [router]);

  // Render Helpers
  const renderItem = useCallback(({ item }: { item: Posto }) => (
    <View className="mb-4">
      <PostoCard
        station={item}
        userLocation={userLocation}
        selectedFuelType={item.combustiveis[0]?.tipo || ''}
        isSelected={false}
        preferredNavigationApp={preferredNavigationApp}
        onPress={handleStationPress} // --- 2. Passamos o handler aqui ---
      />
    </View>
  ), [userLocation, preferredNavigationApp, handleStationPress]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
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
        {/* Header Component */}
        <FavoritesHeader 
          title={t('favorites.title')} 
          onBack={() => router.back()} 
          theme={theme} 
        />

        {/* List */}
        <FlatList
          data={favorites}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          // Empty State Component
          ListEmptyComponent={<EmptyFavorites theme={theme} />}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </>
  );
}