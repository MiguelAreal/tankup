import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Types & Utils
import { Posto } from '../../types/models/Posto';
import { useAppContext } from '../context/AppContext';
import { getBrandImage } from '../utils/brandImages';
import { calculateDistance } from '../utils/location';
import { openNavigationApp } from '../utils/navigationHelper'; // <--- O novo utilitário
import { isStationOpen } from '../utils/schedule';
import { isFavorite, removeFavorite, saveFavorite } from '../utils/storage';

interface PostoCardProps {
  station: Posto;
  userLocation: { latitude: number; longitude: number };
  selectedFuelType: string;
  isSelected?: boolean;
  preferredNavigationApp: 'google_maps' | 'waze' | 'apple_maps';
}

// React.memo impede re-renders se as props não mudarem (ex: scroll na lista pai)
const PostoCard: React.FC<PostoCardProps> = React.memo((props) => {
  const { station, userLocation, selectedFuelType, isSelected, preferredNavigationApp } = props;
  
  const { theme } = useAppContext();
  const { t } = useTranslation();
  
  const [isFavorited, setIsFavorited] = useState(false);
  // useRef para valores que não precisam disparar re-renders
  const highlightAnim = useRef(new Animated.Value(0)).current;

  // --- Effects ---

  useEffect(() => {
    let isActive = true;
    const checkStatus = async () => {
      const favStatus = await isFavorite(station.id);
      if (isActive) setIsFavorited(favStatus);
    };
    checkStatus();
    return () => { isActive = false; };
  }, [station.id]);

  useEffect(() => {
    if (isSelected) {
      // Animação suave e nativa
      Animated.sequence([
        Animated.timing(highlightAnim, { toValue: 1, duration: 200, useNativeDriver: false }), // false pois backgroundColor não suporta native
        Animated.timing(highlightAnim, { toValue: 0.5, duration: 300, useNativeDriver: false }),
        Animated.timing(highlightAnim, { toValue: 0, duration: 500, useNativeDriver: false })
      ]).start();
    }
  }, [isSelected, highlightAnim]);

  // --- Calculations (Memoized for Performance) ---

  const distance = useMemo(() => {
    if (!station.localizacao || !userLocation.latitude) return 0;
    return calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      station.localizacao.coordinates[1],
      station.localizacao.coordinates[0]
    );
  }, [userLocation.latitude, userLocation.longitude, station.localizacao]);

  const selectedFuel = useMemo(() => {
    return station.combustiveis?.find((f: { tipo: string }) => f.tipo === selectedFuelType);
  }, [station.combustiveis, selectedFuelType]);

  const isOpen = useMemo(() => {
    return station.horario ? isStationOpen(station.horario) : false;
  }, [station.horario]);

  const navigationIconName = useMemo(() => {
    switch (preferredNavigationApp) {
      case 'waze': return 'car-sport';
      case 'apple_maps': return 'map';
      default: return 'navigate';
    }
  }, [preferredNavigationApp]);

  // --- Handlers ---

  const handleFavoritePress = useCallback(async () => {
    // Optimistic UI Update (atualiza visualmente antes de esperar o storage)
    setIsFavorited(prev => !prev); 
    try {
      if (isFavorited) {
        await removeFavorite(station.id);
      } else {
        await saveFavorite(station);
      }
    } catch (error) {
      // Reverte se falhar
      setIsFavorited(prev => !prev);
      console.error('Error toggling favorite:', error);
    }
  }, [isFavorited, station]);

  const onNavigate = useCallback(() => {
    if (station.localizacao?.coordinates) {
      const [lng, lat] = station.localizacao.coordinates;
      openNavigationApp(lat, lng, preferredNavigationApp);
    }
  }, [station.localizacao, preferredNavigationApp]);

  // --- Dynamic Styles ---
  
  const containerStyle = {
    backgroundColor: highlightAnim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [theme.card, theme.primaryLight, theme.card]
    }),
    borderColor: isSelected ? theme.primary : theme.border,
    shadowColor: theme.text, // Sombra adapta-se ao tema (preto/branco)
  };

  return (
    <Animated.View 
      style={[
        styles.container, 
        containerStyle,
        { borderWidth: isSelected ? 2 : 1 }
      ]}
    >
      {/* --- Top Row: Brand & Info & Price --- */}
      <View style={styles.rowBetween}>
        <View style={styles.brandContainer}>
          <Image
            source={getBrandImage(station.marca)}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.infoContainer}>
            <Text style={[styles.stationName, { color: theme.text }]} numberOfLines={1}>
              {station.nome}
            </Text>
            <Text style={[styles.stationBrand, { color: theme.textSecondary }]}>
              {station.marca}
            </Text>
            {station.morada && (
              <Text style={[styles.stationAddress, { color: theme.textSecondary }]} numberOfLines={1}>
                {station.morada.localidade}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            onPress={handleFavoritePress} 
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isFavorited ? "heart" : "heart-outline"}
              size={24}
              color={isFavorited ? theme.primary : theme.textSecondary}
            />
          </TouchableOpacity>
          {selectedFuel && (
            <Text style={[styles.price, { color: theme.text }]}>
              {selectedFuel.preco}€
            </Text>
          )}
        </View>
      </View>

      {/* --- Bottom Row: Status & Nav --- */}
      <View style={styles.footerRow}>
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusDot, 
            { backgroundColor: isOpen ? '#22c55e' : '#ef4444' }
          ]} />
          <Text style={{ fontSize: 12, color: theme.textSecondary }}>
            {isOpen ? t('station.open') : t('station.closed')}
          </Text>
        </View>

        <View style={styles.distanceContainer}>
          <Ionicons name="location-outline" size={16} color={theme.textSecondary} />
          <Text style={{ color: theme.textSecondary, marginLeft: 4, fontSize: 12 }}>
            {distance.toFixed(1)} km
          </Text>
        </View>

        <TouchableOpacity onPress={onNavigate} style={styles.navButton}>
          <Ionicons name={navigationIconName} size={20} color={theme.primary} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
});

// Estilos estáticos (Performance: criados apenas uma vez)
const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 10,
    padding: 16,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  logo: {
    width: 42,
    height: 42,
    marginRight: 12,
  },
  infoContainer: {
    flex: 1,
  },
  stationName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  stationBrand: {
    fontSize: 12,
    fontWeight: '500',
  },
  stationAddress: {
    fontSize: 11,
    marginTop: 2,
  },
  actionsContainer: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 42,
  },
  price: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.1)',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navButton: {
    padding: 4,
  }
});

export default PostoCard;