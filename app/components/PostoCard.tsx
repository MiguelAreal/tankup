import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Animated, Image, Linking, Platform, Text, TouchableOpacity, View } from 'react-native';
import { useAppContext } from '../../context/AppContext';
import { Posto } from '../../types/models/Posto';
import stringsEN from '../assets/strings.en.json';
import stringsPT from '../assets/strings.pt.json';
import { getBrandImage } from '../utils/brandImages';
import { calculateDistance } from '../utils/location';
import { isStationOpen } from '../utils/schedule';
import { isFavorite, removeFavorite, saveFavorite } from '../utils/storage';

type Strings = typeof stringsEN;

interface ExtendedPostoCardProps {
  station: Posto;
  userLocation: {
    latitude: number;
    longitude: number;
  };
  selectedFuelType: string;
  isSelected?: boolean;
}

const PostoCard: React.FC<ExtendedPostoCardProps> = ({ station, userLocation, selectedFuelType, isSelected }) => {
  const { preferredNavigationApp, language, theme } = useAppContext();
  const strings = (language === 'en' ? stringsEN : stringsPT) as Strings;
  const [isFavorited, setIsFavorited] = useState(false);
  const highlightAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    checkFavoriteStatus();
  }, [station.id]);

  useEffect(() => {
    if (isSelected) {
      // Start highlight animation with a more noticeable effect
      Animated.sequence([
        Animated.timing(highlightAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(highlightAnim, {
          toValue: 0.5,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(highlightAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [isSelected]);

  const checkFavoriteStatus = async () => {
    const favorite = await isFavorite(station.id);
    setIsFavorited(favorite);
  };

  const handleFavoritePress = async () => {
    try {
      if (isFavorited) {
        await removeFavorite(station.id);
      } else {
        await saveFavorite(station);
      }
      setIsFavorited(!isFavorited);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const isOpen = station.horario ? isStationOpen(station.horario) : false;
  const selectedFuel = station.combustiveis?.find((f: { tipo: string }) => f.tipo === selectedFuelType);
  
  const distance = station.localizacao ? calculateDistance(
    userLocation.latitude,
    userLocation.longitude,
    station.localizacao.coordinates[1],
    station.localizacao.coordinates[0]
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

  const getFuelPrice = (type: string) => {
    const fuel = station.combustiveis.find(c => c.tipo === type);
    return fuel ? fuel.preco : null;
  };

  return (
    <Animated.View 
      className="w-full mb-2 p-4 rounded-xl shadow-sm"
      style={{
        transform: [{
          scale: highlightAnim.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [1, 1.02, 1]
          })
        }],
        backgroundColor: highlightAnim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [
            theme.card,
            theme.primaryLight,
            theme.card
          ]
        }),
        borderWidth: isSelected ? 2 : 1,
        borderColor: isSelected ? theme.primary : theme.border
      }}
    >
      {/* Main row: Logo, Info */}
      <View className="flex-row items-center justify-between">
        {/* Logo and basic info */}
        <View className="flex-row items-center flex-1">
          <Image
            source={getBrandImage(station.marca)}
            style={{ width: 40, height: 40, marginRight: 8 }}
            resizeMode="contain"
          />
          <View className="flex-1">
            <Text style={{ 
              fontSize: 16,
              fontWeight: 'bold',
              color: theme.text
            }} numberOfLines={1}>
              {station.nome}
            </Text>
            <Text style={{ 
              fontSize: 12,
              color: theme.textSecondary
            }}>
              {station.marca}
            </Text>
            {station.morada && (
              <Text style={{ 
                fontSize: 12,
                color: theme.textSecondary
              }} numberOfLines={1}>
                {station.morada.localidade}
              </Text>
            )}
          </View>
        </View>

        {/* Right side: Favorite and Price */}
        <View className="items-end">
          <TouchableOpacity onPress={handleFavoritePress}>
            <Ionicons
              name={isFavorited ? "heart" : "heart-outline"}
              size={24}
              color={isFavorited ? theme.primary : theme.textSecondary}
            />
          </TouchableOpacity>
          {selectedFuel && (
            <Text style={{ 
              fontSize: 18,
              fontWeight: 'bold',
              color: theme.text,
              marginTop: 4
            }}>
              {selectedFuel.preco}€
            </Text>
          )}
        </View>
      </View>

      {/* Bottom row: Status, Distance, Navigation */}
      <View className="flex-row items-center justify-between mt-4">
        <View className="flex-row items-center">
          <View style={{ 
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: isOpen ? '#22c55e' : '#ef4444',
            marginRight: 4
          }} />
          <Text style={{ 
            fontSize: 12,
            color: theme.textSecondary
          }}>
            {isOpen ? strings.station.open : strings.station.closed}
          </Text>
        </View>

        <View className="flex-row items-center">
          <Ionicons name="location" size={16} color={theme.textSecondary} />
          <Text style={{ 
            fontSize: 12,
            color: theme.textSecondary,
            marginLeft: 4
          }}>
            {distance.toFixed(1)} km
          </Text>
        </View>

        <TouchableOpacity
          className="flex-row items-center"
          onPress={() => handleNavigate(station)}
        >
          <Ionicons name={getNavigationIcon()} size={20} color={theme.primary} />
          <Text style={{ 
            fontSize: 12,
            color: theme.primary,
            marginLeft: 4
          }}>
            {strings.station.openInMaps}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export default PostoCard;