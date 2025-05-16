import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import React, { useContext } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { AppContext } from '../../context/AppContext';
import { Station } from './Map/Map.types';

const brandLogos: Record<string, any> = {
  'Galp': require('../../assets/brands/galp.png'),
  'BP': require('../../assets/brands/bp.png'),
  'Repsol': require('../../assets/brands/repsol.png'),
  'Prio': require('../../assets/brands/prio.png'),
};

// Default logo (Galp)
const defaultLogo = require('../../assets/brands/galp.png');

// Fuel type mapping for displaying user-friendly names
const fuelTypeNames: Record<string, string> = {
  'diesel': 'Gasóleo Simples',
  'diesel_special': 'Gasóleo Especial',
  'gasoline_95': 'Gasolina 95',
  'gasoline_98': 'Gasolina 98',
  'gpl': 'GPL Auto',
};

type StationCardProps = {
  station: Station;
  selectedFuelType: string;
  userLocation?: { latitude: number; longitude: number };
  showFavoriteButton?: boolean;
  compact?: boolean;
};

const StationCard: React.FC<StationCardProps> = ({
  station,
  selectedFuelType,
  userLocation,
  showFavoriteButton = true,
  compact = false,
}) => {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = React.useState(false);
  const { preferredNavigationApp } = useContext(AppContext);
  
  // Get the fuel info for the selected type
  const fuelInfo = station.fuels.find(fuel => fuel.type === selectedFuelType);
  
  // Get the appropriate brand logo or use default (Galp)
  const brandLogo = brandLogos[station.brand] || defaultLogo;
  
  React.useEffect(() => {
    // Check if station is already in favorites
    const checkFavoriteStatus = async () => {
      try {
        const favoritesJson = await AsyncStorage.getItem('favoriteStations');
        if (favoritesJson) {
          const favorites = JSON.parse(favoritesJson);
          setIsFavorite(favorites.some((fav: Station) => fav.id === station.id));
        }
      } catch (error) {
        console.error('Error checking favorite status:', error);
      }
    };
    
    checkFavoriteStatus();
  }, [station.id]);
  
  const toggleFavorite = async () => {
    try {
      const favoritesJson = await AsyncStorage.getItem('favoriteStations');
      let favorites: Station[] = favoritesJson ? JSON.parse(favoritesJson) : [];
      
      if (isFavorite) {
        // Remove from favorites
        favorites = favorites.filter((fav: Station) => fav.id !== station.id);
      } else {
        // Add to favorites
        favorites.push(station);
      }
      
      await AsyncStorage.setItem('favoriteStations', JSON.stringify(favorites));
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };
  
  const openInMaps = () => {
    if (!station.latitude || !station.longitude) return;
    
    const label = encodeURIComponent(station.name);
    const latLng = `${station.latitude},${station.longitude}`;
    
    let url;
    switch (preferredNavigationApp) {
      case 'waze':
        url = `waze://?ll=${latLng}&navigate=yes`;
        break;
      case 'apple_maps':
        url = `maps://?q=${label}&ll=${latLng}`;
        break;
      case 'google_maps':
      default:
        url = `https://www.google.com/maps/dir/?api=1&destination=${latLng}&destination_place_id=${station.id}&travelmode=driving`;
        break;
    }
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        // Fall back to Google Maps in browser if app isn't installed
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${latLng}`);
      }
    });
  };
  
  // Render compact view (for bottom sheet)
  if (compact) {
    return (
      <TouchableOpacity 
        className="flex-row justify-between items-center bg-white dark:bg-slate-800 p-3 rounded-lg mb-2"
        onPress={openInMaps}
      >
        <View className="flex-row items-center flex-1">
          <View className="w-10 h-10 rounded-full items-center justify-center mr-3 overflow-hidden">
            <Image 
              source={brandLogo} 
              style={{ width: 40, height: 40 }}
              resizeMode="contain"
            />
          </View>
          <View className="flex-1">
            <Text className="font-medium text-slate-800 dark:text-slate-200" numberOfLines={1}>
              {station.name}
            </Text>
            <Text className="text-slate-600 dark:text-slate-400 text-sm" numberOfLines={1}>
              {station.distance ? `${station.distance.toFixed(1)} km` : ''}
            </Text>
          </View>
        </View>
        
        <View className="flex-row items-center">
          {fuelInfo && (
            <Text className="font-bold text-lg mr-2 text-blue-600 dark:text-blue-400">
              {fuelInfo.price.toFixed(3)} €
            </Text>
          )}
          <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
        </View>
      </TouchableOpacity>
    );
  }
  
  // Full view for the main station card
  return (
    <View className="bg-white dark:bg-slate-800 rounded-lg p-4 mb-3 shadow-sm">
      {/* Header with brand and favorite button */}
      <View className="flex-row justify-between items-center mb-2">
        <View className="flex-row items-center">
          <View className="w-12 h-12 rounded-full items-center justify-center mr-3 overflow-hidden">
            <Image 
              source={brandLogo} 
              style={{ width: 48, height: 48 }}
              resizeMode="contain"
            />
          </View>
          <View>
            <Text className="font-medium text-lg text-slate-800 dark:text-slate-200">
              {station.name}
            </Text>
            <Text className="text-slate-600 dark:text-slate-400 text-sm">
              {station.brand}
            </Text>
          </View>
        </View>
        
        {showFavoriteButton && (
          <TouchableOpacity 
            className="p-2" 
            onPress={toggleFavorite}
          >
            <Ionicons 
              name={isFavorite ? "heart" : "heart-outline"} 
              size={24} 
              color={isFavorite ? "#ef4444" : "#94a3b8"} 
            />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Station info */}
      <View className="mb-3">
        <Text className="text-slate-600 dark:text-slate-400" numberOfLines={2}>
          {station.address}
        </Text>
        
        {station.distance !== undefined && (
          <Text className="text-slate-600 dark:text-slate-400 mt-1">
            Distância: <Text className="font-medium">{station.distance.toFixed(1)} km</Text>
          </Text>
        )}
      </View>
      
      {/* Fuel price */}
      <View className="flex-row justify-between items-center mb-4 bg-blue-50 dark:bg-slate-700 p-3 rounded-lg">
        <View>
          <Text className="text-slate-600 dark:text-slate-400 text-sm">
            {fuelTypeNames[selectedFuelType] || selectedFuelType}
          </Text>
          {fuelInfo ? (
            <Text className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {fuelInfo.price.toFixed(3)} €/L
            </Text>
          ) : (
            <Text className="text-slate-500 dark:text-slate-500 italic">
              Não disponível
            </Text>
          )}
        </View>
        
        {fuelInfo && fuelInfo.price < 1.8 && (
          <View className="bg-green-100 dark:bg-green-900 px-3 py-1 rounded-full">
            <Text className="text-green-600 dark:text-green-400 font-medium text-sm">
              Bom preço
            </Text>
          </View>
        )}
      </View>
      
      {/* Navigation button */}
      <View className="flex-row justify-between">
        <TouchableOpacity
          className="flex-1 bg-blue-600 rounded-lg py-3 flex-row justify-center items-center"
          onPress={openInMaps}
        >
          <Ionicons name="navigate" size={18} color="#ffffff" />
          <Text className="ml-2 text-white font-medium">
            {preferredNavigationApp === 'waze' ? 'Abrir no Waze' : 
             preferredNavigationApp === 'apple_maps' ? 'Abrir no Apple Maps' : 
             'Abrir no Maps'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default StationCard;