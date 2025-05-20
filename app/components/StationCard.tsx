import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import React, { useContext } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { AppContext } from '../../context/AppContext';
import stringsEN from '../assets/strings.en.json';
import stringsPT from '../assets/strings.pt.json';
import { Strings } from '../types/strings';
import { calculateDistance } from '../utils/location';
import { Station } from './Map/Map.types';

const brandLogos: Record<string, any> = {
  'Galp': require('../../assets/brands/galp.png'),
  'BP': require('../../assets/brands/bp.png'),
  'Repsol': require('../../assets/brands/repsol.png'),
  'Prio': require('../../assets/brands/prio.png'),
};

// Default logo (Galp)
const defaultLogo = require('../../assets/brands/galp.png');


type StationCardProps = {
  station: Station;
  selectedFuelType: string;
  userLocation?: { latitude: number; longitude: number };
  showFavoriteButton?: boolean;
  compact?: boolean;
  isSelected?: boolean;
};

const StationCard: React.FC<StationCardProps> = ({
  station,
  selectedFuelType,
  userLocation,
  showFavoriteButton = true,
  compact = false,
  isSelected = false,
}) => {
  const [isFavorite, setIsFavorite] = React.useState(false);
  const { preferredNavigationApp, language } = useContext(AppContext);
  const strings = (language === 'en' ? stringsEN : stringsPT) as Strings;
  
  // Get the fuel info for the selected type
  const fuelInfo = station.combustiveis.find(fuel => fuel.tipo === selectedFuelType);
  
  // Get the appropriate brand logo or use default (Galp)
  const brandLogo = brandLogos[station.marca] || defaultLogo;

  // Calculate distance if user location is available
  const distance = userLocation ? calculateDistance(
    userLocation.latitude,
    userLocation.longitude,
    station.localizacao.coordinates[1],
    station.localizacao.coordinates[0]
  ) : station.distancia / 1000; // Convert meters to kilometers
  
  React.useEffect(() => {
    // Check if station is already in favorites
    const checkFavoriteStatus = async () => {
      try {
        const favoritesJson = await AsyncStorage.getItem('favoriteStations');
        if (favoritesJson) {
          const favorites = JSON.parse(favoritesJson);
          setIsFavorite(favorites.some((fav: Station) => fav.idDgeg === station.idDgeg));
        }
      } catch (error) {
        console.error('Error checking favorite status:', error);
      }
    };
    
    checkFavoriteStatus();
  }, [station.idDgeg]);
  
  const toggleFavorite = async () => {
    try {
      const favoritesJson = await AsyncStorage.getItem('favoriteStations');
      let favorites: Station[] = favoritesJson ? JSON.parse(favoritesJson) : [];
      
      if (isFavorite) {
        // Remove from favorites
        favorites = favorites.filter((fav: Station) => fav.idDgeg !== station.idDgeg);
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
    const [lng, lat] = station.localizacao.coordinates;
    if (!lat || !lng) return;
    
    const label = encodeURIComponent(station.nome);
    const latLng = `${lat},${lng}`;
    
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
        url = `https://www.google.com/maps/dir/?api=1&destination=${latLng}&destination_place_id=${station.idDgeg}&travelmode=driving`;
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
        className={`flex-row justify-between items-center p-3 rounded-lg mb-2 ${isSelected ? 'bg-slate-100 dark:bg-slate-700' : 'bg-white dark:bg-slate-800'}`}
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
              {station.nome}
            </Text>
            <Text className="text-slate-600 dark:text-slate-400 text-sm" numberOfLines={1}>
              {distance !== undefined ? `${distance.toFixed(1)} ${strings.station.distance}` : ''}
            </Text>
          </View>
        </View>
        
        <View className="flex-row items-center">
          {fuelInfo && (
            <Text className="font-bold text-lg mr-2 text-blue-600 dark:text-blue-400">
              {fuelInfo.preco.toFixed(3)} €
            </Text>
          )}
          <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
        </View>
      </TouchableOpacity>
    );
  }
  
  // Full view for the main station card
  return (
    <View className={`rounded-lg p-4 mb-3 shadow-sm ${isSelected ? 'bg-slate-50 dark:bg-slate-700' : 'bg-white dark:bg-slate-800'}`}>
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
              {station.nome}
            </Text>
            <Text className="text-slate-600 dark:text-slate-400 text-sm">
              {station.marca}
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
          {station.morada.morada}, {station.morada.localidade}
        </Text>
        
        {distance !== undefined && (
          <Text className="text-slate-600 dark:text-slate-400 mt-1">
            {strings.station.distance}: <Text className="font-medium">{distance.toFixed(1)} km</Text>
          </Text>
        )}
      </View>
      
      {/* Fuel price */}
      <View className="flex-row justify-between items-center mb-4 bg-blue-50 dark:bg-slate-700 p-3 rounded-lg">
        <View>
          <Text className="text-slate-600 dark:text-slate-400 text-sm">
            {strings.station.fuelType[selectedFuelType as keyof typeof strings.station.fuelType]}
          </Text>
          {fuelInfo ? (
            <Text className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {fuelInfo.preco.toFixed(3)} €/L
            </Text>
          ) : (
            <Text className="text-slate-500 dark:text-slate-500 italic">
              {strings.station.notAvailable}
            </Text>
          )}
        </View>
        
        {fuelInfo && fuelInfo.preco < 1.8 && (
          <View className="bg-green-100 dark:bg-green-900 px-3 py-1 rounded-full">
            <Text className="text-green-600 dark:text-green-400 font-medium text-sm">
              {strings.station.goodPrice}
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
            {preferredNavigationApp === 'waze' ? strings.station.openInWaze : 
             preferredNavigationApp === 'apple_maps' ? strings.station.openInAppleMaps : 
             strings.station.openInMaps}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default StationCard;