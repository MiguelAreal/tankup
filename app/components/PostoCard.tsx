import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Image, Linking, Platform, Text, TouchableOpacity, View } from 'react-native';
import { useAppContext } from '../../context/AppContext';
import stringsEN from '../assets/strings.en.json';
import stringsPT from '../assets/strings.pt.json';
import { Posto } from '../types/models';
import { PostoCardProps } from '../types/models/PostoCardProps';
import { Strings } from '../types/strings';
import { getBrandImage } from '../utils/brandImages';
import { calculateDistance } from '../utils/location';
import { isStationOpen } from '../utils/schedule';

const PostoCard: React.FC<PostoCardProps> = ({ posto, userLocation, selectedFuelType }) => {
  const { preferredNavigationApp, language } = useAppContext();
  const strings = (language === 'en' ? stringsEN : stringsPT) as Strings;
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    checkIfFavorite();
  }, []);

  const checkIfFavorite = async () => {
    try {
      const favorites = await AsyncStorage.getItem('favoriteStations');
      if (favorites) {
        const favoriteStations = JSON.parse(favorites);
        setIsFavorite(favoriteStations.some((station: Posto) => station.idDgeg === posto.idDgeg));
      }
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const toggleFavorite = async () => {
    try {
      const favorites = await AsyncStorage.getItem('favoriteStations');
      let favoriteStations = favorites ? JSON.parse(favorites) : [];

      if (isFavorite) {
        favoriteStations = favoriteStations.filter((station: Posto) => station.idDgeg !== posto.idDgeg);
      } else {
        favoriteStations.push(posto);
      }

      await AsyncStorage.setItem('favoriteStations', JSON.stringify(favoriteStations));
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const isOpen = posto.horario ? isStationOpen(posto.horario) : false;
  const selectedFuel = posto.combustiveis?.find(fuel => fuel.tipo === selectedFuelType);
  
  const distance = posto.localizacao ? calculateDistance(
    userLocation.latitude,
    userLocation.longitude,
    posto.localizacao.coordinates[1],
    posto.localizacao.coordinates[0]
  ) : 0;

  const openInMaps = async () => {
    if (!posto.localizacao) return;
    
    const [longitude, latitude] = posto.localizacao.coordinates;
    let url = '';

    if (Platform.OS === 'android') {
      switch (preferredNavigationApp) {
        case 'google_maps':
          url = `google.navigation:q=${latitude},${longitude}`;
          break;
        case 'waze':
          url = `waze://?ll=${latitude},${longitude}&navigate=yes`;
          break;
        default:
          url = `google.navigation:q=${latitude},${longitude}`;
      }
    } else {
      switch (preferredNavigationApp) {
        case 'google_maps':
          url = `comgooglemaps://?daddr=${latitude},${longitude}&directionsmode=driving`;
          break;
        case 'waze':
          url = `waze://?ll=${latitude},${longitude}&navigate=yes`;
          break;
        case 'apple_maps':
          url = `maps://?daddr=${latitude},${longitude}&dirflg=d`;
          break;
        default:
          url = `maps://?daddr=${latitude},${longitude}&dirflg=d`;
      }
    }

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        // Fallback to web URLs
        const webUrl = preferredNavigationApp === 'google_maps' 
          ? `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`
          : preferredNavigationApp === 'waze'
          ? `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`
          : Platform.OS === 'ios'
          ? `https://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=d`
          : `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
        
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      console.error('Error opening maps:', error);
      // Final fallback to Google Maps web
      const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
      await Linking.openURL(webUrl);
    }
  };

  const getNavigationButtonText = () => {
    switch (preferredNavigationApp) {
      case 'google_maps':
        return strings.station.openInGoogleMaps;
      case 'waze':
        return strings.station.openInWaze;
      case 'apple_maps':
        return strings.station.openInAppleMaps;
      default:
        return strings.station.openInGoogleMaps;
    }
  };

  return (
    <TouchableOpacity
      className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 m-2"
    >
      {/* Header with logo, name, brand and favorite button */}
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-row items-center">
          <Image
            source={getBrandImage(posto.marca)}
            style={{ width: 64, height: 64, marginRight: 8 }}
            resizeMode="contain"
          />
          <View className="flex-2">
            <Text className="text-lg font-bold text-slate-800 dark:text-slate-200">{posto.nome}</Text>
            <Text className="text-sm text-slate-600 dark:text-slate-400">{posto.marca}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={toggleFavorite} className="p-2">
          <Ionicons 
            name={isFavorite ? "heart" : "heart-outline"} 
            size={24} 
            color={isFavorite ? "#ef4444" : "#64748b"} 
          />
        </TouchableOpacity>
      </View>

      {/* Address and distance */}
      <View className="mb-3">
        {posto.morada && (
          <>
            <Text className="text-slate-600 dark:text-slate-400">{posto.morada.morada}</Text>
            <Text className="text-slate-600 dark:text-slate-400">{posto.morada.localidade}</Text>
          </>
        )}
        <Text className="text-slate-600 dark:text-slate-400">{distance.toFixed(1)} {strings.station.distance}</Text>
      </View>

      {/* Fuel info with background */}
      {selectedFuel && (
        <View className="bg-slate-100 dark:bg-slate-700 rounded-lg p-3 mb-3">
          <Text className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
            {strings.station.fuelType[selectedFuelType as keyof typeof strings.station.fuelType]}
          </Text>
          <Text className="text-2xl font-bold text-slate-800 dark:text-slate-200">
            {selectedFuel.preco.toFixed(3)} €
          </Text>
        </View>
      )}

      {/* Status and navigation button */}
      <View className="flex-row items-center justify-between mb-3">
        <Text className={`${isOpen ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} font-semibold`}>
          {isOpen ? strings.station.open : strings.station.closed}
        </Text>
      </View>

      {/* Full width navigation button */}
      <TouchableOpacity 
        onPress={openInMaps}
        className="bg-blue-600 p-3 rounded-lg flex-row items-center justify-center"
      >
        <Ionicons name="navigate" size={20} color="white" className="mr-2" />
        <Text className="text-white font-medium ml-2">
          {getNavigationButtonText()}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

export default PostoCard;