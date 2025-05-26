import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Animated, Image, Linking, Platform, Text, TouchableOpacity, View } from 'react-native';
import { useAppContext } from '../../context/AppContext';
import stringsEN from '../assets/strings.en.json';
import stringsPT from '../assets/strings.pt.json';
import { Posto } from '../types/models';
import { PostoCardProps } from '../types/models/PostoCardProps';
import { Strings } from '../types/strings';
import { getBrandImage } from '../utils/brandImages';
import { calculateDistance } from '../utils/location';
import { isStationOpen } from '../utils/schedule';

interface ExtendedPostoCardProps extends PostoCardProps {
  isSelected?: boolean;
}

const PostoCard: React.FC<ExtendedPostoCardProps> = ({ posto, userLocation, selectedFuelType, isSelected }) => {
  const { preferredNavigationApp, language } = useAppContext();
  const strings = (language === 'en' ? stringsEN : stringsPT) as Strings;
  const [isFavorite, setIsFavorite] = useState(false);
  const highlightAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      try {
        const isFavorite = await AsyncStorage.getItem(`favorite_${posto.idDgeg}`);
        setIsFavorite(isFavorite === 'true');
      } catch (error) {
        // Silent error handling
      }
    };
    checkFavoriteStatus();
  }, [posto.idDgeg]);

  useEffect(() => {
    if (isSelected) {
      // Start highlight animation
      Animated.sequence([
        Animated.timing(highlightAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(highlightAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [isSelected]);

  const toggleFavorite = async () => {
    try {
      const newFavoriteStatus = !isFavorite;
      await AsyncStorage.setItem(`favorite_${posto.idDgeg}`, String(newFavoriteStatus));
      setIsFavorite(newFavoriteStatus);
    } catch (error) {
      // Silent error handling
    }
  };

  const isOpen = posto.horario ? isStationOpen(posto.horario) : false;
  const selectedFuel = posto.combustiveis?.find(f => f.tipo === selectedFuelType);
  
  const distance = posto.localizacao ? calculateDistance(
    userLocation.latitude,
    userLocation.longitude,
    posto.localizacao.coordinates[1],
    posto.localizacao.coordinates[0]
  ) : 0;

  const handleNavigate = (station: Posto) => {
    if (!station.localizacao || !station.localizacao.coordinates) {
      return;
    }

    // Ensure we have valid coordinates
    const coordinates = station.localizacao.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length !== 2) {
      return;
    }

    // Coordinates are stored as [longitude, latitude] in the Posto type
    const [longitude, latitude] = coordinates;
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return;
    }

    let url = '';
    switch (preferredNavigationApp) {
      case 'google_maps':
        url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
        break;
      case 'waze':
        url = `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;
        break;
      case 'apple_maps':
        url = `maps://app?daddr=${latitude},${longitude}`;
        break;
      default:
        url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
        break;
    }

    if (url) {
      if (Platform.OS === 'web') {
        const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
        if (newWindow) {
          newWindow.focus();
        }
      } else {
        Linking.canOpenURL(url).then((supported) => {
          if (supported) {
            return Linking.openURL(url);
          } else {
            const fallbackUrl = preferredNavigationApp === 'apple_maps'
              ? `https://maps.apple.com/?daddr=${latitude},${longitude}`
              : `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
            return Linking.openURL(fallbackUrl);
          }
        }).catch(() => {
          Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`);
        });
      }
    }
  };

  const getNavigationIcon = () => {
    switch (preferredNavigationApp) {
      case 'waze':
        return 'car-sport';
      case 'apple_maps':
        return 'map';
      default:
        return 'navigate';
    }
  };

  return (
    <Animated.View
      style={{
        transform: [{
          scale: highlightAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.02]
          })
        }],
        backgroundColor: highlightAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['transparent', '#e0f2fe']
        })
      }}
      className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 mx-2 my-6 border border-slate-200 dark:border-slate-700"
    >
      {/* Main row: Logo, Info */}
      <View className="flex-row items-center justify-between">
        {/* Logo and basic info */}
        <View className="flex-row items-center flex-1">
          <Image
            source={getBrandImage(posto.marca)}
            style={{ width: 40, height: 40, marginRight: 8 }}
            resizeMode="contain"
          />
          <View className="flex-1">
            <Text className="text-base font-bold text-slate-800 dark:text-slate-200" numberOfLines={1}>
              {posto.nome}
            </Text>
            <Text className="text-xs text-slate-600 dark:text-slate-400">
              {posto.marca}
            </Text>
            {posto.morada && (
              <Text className="text-xs text-slate-500 dark:text-slate-500" numberOfLines={1}>
                {posto.morada.localidade}
              </Text>
            )}
          </View>
        </View>

        {/* Right side: Favorite and Price */}
        <View className="items-end">
          <TouchableOpacity 
            onPress={toggleFavorite} 
            className="p-1 mb-1"
          >
            <Ionicons 
              name={isFavorite ? "heart" : "heart-outline"} 
              size={20} 
              color={isFavorite ? "#ef4444" : "#64748b"} 
            />
          </TouchableOpacity>

          {selectedFuel && (
            <View className="bg-blue-50 dark:bg-blue-900/30 rounded-lg px-7 py-1">
              <Text className="text-xs font-medium text-blue-600 dark:text-blue-400">
                {strings.station.fuelType[selectedFuelType as keyof typeof strings.station.fuelType]}
              </Text>
              <Text className="text-xl font-bold text-blue-700 dark:text-blue-300">
                {selectedFuel.preco.toFixed(3)}€
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Bottom row: Status, Distance, Navigation */}
      <View className="flex-row items-center justify-between mt-2">
        {/* Status and distance */}
        <View className="flex-row items-center">
          <View className="flex-row items-center mr-3">
            <Ionicons 
              name="time-outline" 
              size={14} 
              color={isOpen ? "#16a34a" : "#dc2626"} 
            />
            <Text className={`text-xs font-medium ml-1 ${isOpen ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {isOpen ? strings.station.open : strings.station.closed}
            </Text>
          </View>
          
          <View className="flex-row items-center">
            <Ionicons 
              name="location-outline" 
              size={14} 
              color="#64748b" 
            />
            <Text className="text-xs text-slate-600 dark:text-slate-400 ml-1">
              {distance.toFixed(1)} km
            </Text>
          </View>
        </View>

        {/* Navigation button */}
        <TouchableOpacity
          onPress={() => handleNavigate(posto)}
          className="bg-blue-600 dark:bg-blue-500 px-4 py-2 rounded-lg flex-row items-center"
        >
          <Ionicons name={getNavigationIcon()} size={16} color="white" />
          <Text className="text-white text-sm font-medium ml-1">
            {strings.station.openInMaps}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export default PostoCard;