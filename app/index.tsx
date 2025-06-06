import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Animated, BackHandler, Easing, Platform, SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { useAppContext } from '../context/AppContext';
import { Posto } from '../types/models';
import FuelTypeSelector from './components/FuelTypeSelector';
import Header from './components/Header';
import MapComponent from './components/Map/Map';
import ResponsiveAdBanner from './components/ResponsiveAdBanner';
import StationList from './components/StationList';
import StatusMessage from './components/StatusMessage';
import { useInterstitialAd } from './hooks/useInterstitialAd';
import { fetchNearbyStations, fetchStationsByLocation } from './utils/api';
import { isWithinRadius } from './utils/location';

// Memoized components
const MemoizedHeader = React.memo(Header);
const MemoizedFuelTypeSelector = React.memo(FuelTypeSelector);
const MemoizedMapComponent = React.memo(MapComponent);
const MemoizedStationList = React.memo(StationList);
const MemoizedStatusMessage = React.memo(StatusMessage);

// Define types
export default function HomeScreen() {
  const mapHeight = useRef(new Animated.Value(0.60)).current;
  const currentMapHeight = useRef(0.60);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const mapRef = useRef<any>(null);
  const router = useRouter();
  const params = useLocalSearchParams();
  const cardHeights = useRef<number[]>([]);
  const { t } = useTranslation();

  const { 
    darkMode, 
    searchRadius, 
    language, 
    selectedFuelTypes, 
    searchState, 
    setSearchState, 
    clearSearch: clearSearchContext,
    preferredNavigationApp 
  } = useAppContext();

  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean>(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [allStations, setAllStations] = useState<Posto[]>([]);
  const [filteredStations, setFilteredStations] = useState<Posto[]>([]);
  const [selectedFuelType, setSelectedFuelType] = useState(selectedFuelTypes[0] || 'Gasóleo simples');
  const [selectedStation, setSelectedStation] = useState<Posto | null>(null);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [currentSort, setCurrentSort] = useState<'mais_caro' | 'mais_barato' | 'mais_longe' | 'mais_perto'>('mais_barato');
  const lastFetchTime = useRef<number>(0);
  const POLLING_INTERVAL = 10000; // 10 seconds in milliseconds
  const { showAd } = useInterstitialAd();

  // Memoized handlers
  const handleFuelTypeChange = useCallback((fuelType: string) => {
    setSelectedFuelType(fuelType);
    setIsLoading(true);
    setFilteredStations([]);
    if (!isSearchActive && location) {
      fetchAndFilterStations(location.coords, true, fuelType);
      showAd();
    }
  }, [isSearchActive, location, showAd]);

  const handleSortChange = useCallback((sort: 'mais_caro' | 'mais_barato' | 'mais_longe' | 'mais_perto') => {
    setIsLoading(true);
    setFilteredStations([]);
    
    if (isSearchActive && searchState) {
      const updatedSearchState = {
        ...searchState,
        sortBy: sort as 'mais_caro' | 'mais_barato'
      };
      setSearchState(updatedSearchState);
      
      fetchStationsByLocation({
        distrito: searchState.distrito,
        municipio: searchState.municipio,
        fuelType: searchState.fuelType,
        sortBy: sort as 'mais_caro' | 'mais_barato'
      }).then((data: Posto[]) => {
        setAllStations(data);
        setFilteredStations(data);
        setIsLoading(false);
      }).catch((error) => {
        setErrorMsg('No internet connection');
        setIsLoading(false);
      });
    } else if (location) {
      fetchNearbyStations<Posto[]>(
        location.coords.latitude,
        location.coords.longitude,
        searchRadius * 1000,
        selectedFuelType,
        sort
      ).then((data) => {
        setAllStations(data);
        setFilteredStations(data);
        setCurrentSort(sort);
        setIsLoading(false);
      }).catch((error) => {
        setErrorMsg('No internet connection');
        setIsLoading(false);
      });
    }
  }, [isSearchActive, searchState, location, searchRadius, selectedFuelType, setSearchState]);

  const handleMarkerPress = useCallback((station: Posto | null) => {
    setSelectedStation(station);
    if (station) {
      const stationIndex = filteredStations.findIndex(s => s.id === station.id);
      
      if (stationIndex !== -1) {
        const headerHeight = 60;
        const mapHeightPercent = 0.60;
        const screenHeight = window.innerHeight;
        const mapHeight = screenHeight * mapHeightPercent;
        
        const targetPosition = cardHeights.current
          .slice(0, stationIndex)
          .reduce((sum, height) => sum + height, 0);
        
        const visibleArea = screenHeight - mapHeight;
        const scrollPosition = Math.max(0, targetPosition - (visibleArea / 2) + headerHeight);
        
        currentMapHeight.current = mapHeightPercent;
        animateMapHeight(0.60);
        setTimeout(() => {
          if (scrollViewRef.current) {
            scrollViewRef.current.scrollTo({
              y: scrollPosition,
              animated: true
            });
          }
        }, 50);
      }
    }
  }, [filteredStations]);

  const handleNavigate = useCallback((station: Posto) => {
    const [longitude, latitude] = station.localizacao.coordinates;
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
    }

    if (url) {
      showAd();
      window.open(url, '_blank');
    }
  }, [preferredNavigationApp, showAd]);

  const handleScroll = useCallback((event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const newMapHeight = offsetY > 30 ? 0.40 : 0.60;
    
    if (Math.abs(currentMapHeight.current - newMapHeight) > 0.01) {
      currentMapHeight.current = newMapHeight;
      Animated.timing(mapHeight, {
        toValue: newMapHeight,
        duration: 50,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();
    }
  }, [mapHeight]);

  const measureCardHeight = useCallback((index: number, height: number) => {
    cardHeights.current[index] = height;
  }, []);

  const clearSearch = useCallback(async () => {
    setIsSearchActive(false);
    setFilteredStations([]);
    setAllStations([]);
    setIsFetchingMore(true);
    setSelectedStation(null);
    clearSearchContext();
    
    if (location) {
      try {
        const data = await fetchNearbyStations<Posto[]>(
          location.coords.latitude,
          location.coords.longitude,
          searchRadius * 1000,
          selectedFuelType,
          'mais_barato'
        );
        
        setAllStations(data);
        setFilteredStations(data);
      } catch (error) {
        setErrorMsg('No internet connection');
      } finally {
        setIsFetchingMore(false);
      }
    }
  }, [location, searchRadius, selectedFuelType, clearSearchContext]);

  // Memoized fetch and filter function
  const fetchAndFilterStations = useCallback(async (location: Location.LocationObjectCoords, forceFetch: boolean = false, fuelType?: string) => {
    if (isFetchingMore && !forceFetch) return;
    
    const now = Date.now();
    if (!isSearchActive && !forceFetch && now - lastFetchTime.current < POLLING_INTERVAL) {
      return;
    }
    
    setIsFetchingMore(true);
    lastFetchTime.current = now;
    
    const currentFuelType = fuelType || selectedFuelType;

    try {
      const data = await fetchNearbyStations<Posto[]>(
        location.latitude,
        location.longitude,
        searchRadius * 1000,
        currentFuelType,
        currentSort
      );
      
      setAllStations(data);
      setFilteredStations(data);
    } catch (error) {
      setErrorMsg('No internet connection');
      setAllStations([]);
      setFilteredStations([]);
    } finally {
      setIsFetchingMore(false);
      setIsLoading(false);
    }
  }, [searchRadius, currentSort, isFetchingMore, isSearchActive, selectedFuelType]);

  // Memoized animation function
  const animateMapHeight = useCallback((toValue: number) => {
    Animated.timing(mapHeight, {
      toValue,
      duration: 50,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  }, [mapHeight]);

  // Memoized search header
  const searchHeader = useMemo(() => {
    if (!isSearchActive || !searchState) return null;
    return (
      <View className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <View className="flex-row items-center justify-between px-4 py-3">
          <View className="flex-1">
            <Text className="text-base font-medium text-slate-800 dark:text-slate-200">
              {searchState.distrito && `${searchState.distrito}`}
              {searchState.municipio && `, ${searchState.municipio}`}
            </Text>
            <Text className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {t(`station.fuelType.${selectedFuelType}`)}
            </Text>
          </View>
          <TouchableOpacity
            onPress={clearSearch}
            className="flex-row items-center bg-blue-50 dark:bg-blue-900/30 px-3 py-2 rounded-full"
          >
            <Ionicons name="close-circle" size={16} color="#3b82f6" />
            <Text className="text-blue-600 dark:text-blue-400 text-sm font-medium ml-1">
              {t('search.clear')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [isSearchActive, searchState, selectedFuelType, clearSearch, t]);

  // Initial setup
  useEffect(() => {
    const initialize = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        setHasLocationPermission(status === 'granted');
        
        if (status !== 'granted') {
          setErrorMsg('Location permission denied');
          setAllStations([]);
          return;
        }

        const initialLocation = await Location.getCurrentPositionAsync({});
        setLocation(initialLocation);

        locationSubscription.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 10000,
            distanceInterval: 50,
          },
          (newLocation) => {
            setLocation(newLocation);
          }
        );
      } catch (error) {
        setErrorMsg('Could not fetch location');
        setAllStations([]);
        setLocation({
          coords: {
            latitude: 38.736946,
            longitude: -9.142685,
            altitude: null,
            accuracy: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null
          },
          timestamp: Date.now()
        });
      }
    };

    initialize();

    return () => {
      if (locationSubscription.current) {
        try {
          locationSubscription.current.remove();
        } catch (error) {
          // Silent error handling
        }
      }
    };
  }, []);

  // Effect to fetch stations when location changes
  useEffect(() => {
    if (!location || isSearchActive) return;
    fetchAndFilterStations(location.coords);
  }, [location, isSearchActive, fetchAndFilterStations]);

  // Filter stations based on current location and search radius
  useEffect(() => {
    if (!location || !allStations.length || isSearchActive || isFetchingMore) return;
    
    const filtered = allStations.filter(station => {
      const [stationLng, stationLat] = station.localizacao.coordinates;
      const isWithin = isWithinRadius(
        stationLat,
        stationLng,
        location.coords.latitude,
        location.coords.longitude,
        searchRadius
      );
      return isWithin;
    });

    setFilteredStations(filtered);
  }, [location, allStations, searchRadius, isSearchActive, isFetchingMore]);

  // Handle search results
  useEffect(() => {
    if (params.searchType === 'location' && !isSearchActive) {
      setIsSearchActive(true);
      setSearchState({
        results: [],
        searchType: 'location',
        distrito: params.distrito as string,
        municipio: params.municipio as string,
        fuelType: params.fuelType as string,
        sortBy: params.sortBy as 'mais_caro' | 'mais_barato'
      });

      setIsFetchingMore(true);
      fetchStationsByLocation({
        distrito: params.distrito as string,
        municipio: params.municipio as string,
        fuelType: params.fuelType as string || selectedFuelType,
        sortBy: (params.sortBy as 'mais_caro' | 'mais_barato') || 'mais_barato'
      }).then((data: Posto[]) => {
        setAllStations(data);
        setFilteredStations(data);
        setSearchState({
          results: data,
          searchType: 'location',
          distrito: params.distrito as string,
          municipio: params.municipio as string,
          fuelType: params.fuelType as string || selectedFuelType,
          sortBy: (params.sortBy as 'mais_caro' | 'mais_barato') || 'mais_barato'
        });
        setIsFetchingMore(false);

        setTimeout(() => {
          if (data.length > 0 && mapRef.current) {
            const [lng, lat] = data[0].localizacao.coordinates;
            
            if (Platform.OS === 'web') {
              try {
                const map = mapRef.current;
                if (map && typeof map.setView === 'function') {
                  map.setView([lat, lng], 13, {
                    animate: true,
                    duration: 1
                  });
                }
              } catch (error) {
                // Silent error handling
              }
            } else {
              try {
                const map = mapRef.current;
                if (map && typeof map.animateToRegion === 'function') {
                  map.animateToRegion({
                    latitude: lat,
                    longitude: lng,
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02,
                  }, 1000);
                }
              } catch (error) {
                // Silent error handling
              }
            }
          }
        }, 500);
      }).catch((error: Error) => {
        setErrorMsg('No internet connection');
        setIsFetchingMore(false);
      });
    }
  }, [params.searchType, params.distrito, params.municipio, params.fuelType, params.sortBy, isSearchActive, selectedFuelType, setSearchState]);

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

  // Add map centering effect
  useEffect(() => {
    if (location && mapRef.current) {
      if (Platform.OS === 'web') {
        try {
          const map = mapRef.current;
          if (map && typeof map.setView === 'function') {
            map.setView([location.coords.latitude, location.coords.longitude], 13, {
              animate: true,
              duration: 1
            });
          }
        } catch (error) {
          // Silent error handling
        }
      } else {
        try {
          const map = mapRef.current;
          if (map && typeof map.animateToRegion === 'function') {
            map.animateToRegion({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }, 1000);
          }
        } catch (error) {
          // Silent error handling
        }
      }
    }
  }, [location]);

  // Render loading screen
  if (isFetchingMore && !allStations.length) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-100 dark:bg-slate-900">
        <ActivityIndicator size="large" color="#0066cc" />
        <Text className="mt-4 text-lg font-medium text-center text-slate-700 dark:text-slate-200">
          {t('station.loading')}
        </Text>
      </View>
    );
  }

  // Render error screen
  if (errorMsg === 'No internet connection') {
    return (
      <View className="flex-1 items-center justify-center bg-slate-100 dark:bg-slate-900 p-4">
        <Text className="text-xl font-semibold text-slate-800 dark:text-slate-200 text-center mb-4">
          {t('error.noInternet')}
        </Text>
        <Text className="text-slate-600 dark:text-slate-400 text-center mb-8">
          {t('error.checkConnection')}
        </Text>
        <TouchableOpacity
          className="bg-blue-600 px-6 py-3 rounded-lg"
          onPress={() => BackHandler.exitApp()}
        >
          <Text className="text-white font-medium">{t('common.exit')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />

      <MemoizedHeader />

      {errorMsg && (
        <MemoizedStatusMessage 
          message={t('status.error')}
          type="error"
        />
      )}

      {!hasLocationPermission ? (
        <MemoizedStatusMessage 
          message={t('status.locationPermissionDenied')}
          type="warning"
        />
      ) : !isSearchActive && filteredStations.length === 0 && !isLoading ? (
        <MemoizedStatusMessage 
          message={t('status.noStationsFound')}
          type="info"
        />
      ) : (
        <>
          {searchHeader}

          {!isSearchActive && (
            <View className="flex-none">
              <MemoizedFuelTypeSelector 
                selectedFuelType={selectedFuelType} 
                onSelectFuelType={handleFuelTypeChange}
                selectedSort={currentSort}
                onSelectSort={handleSortChange}
              />
            </View>
          )}

          <Animated.View style={{ height: mapHeight.interpolate({
            inputRange: [0, 1],
            outputRange: ['0%', '80%']
          })}}>
            <MemoizedMapComponent
              mapRef={mapRef}
              stations={isSearchActive ? allStations : filteredStations}
              userLocation={location?.coords || { latitude: 38.736946, longitude: -9.142685 }}
              onMarkerPress={handleMarkerPress}
              selectedStation={selectedStation}
              selectedFuelType={selectedFuelType}
              searchRadius={isSearchActive ? 0 : searchRadius}
            />
          </Animated.View>

          <View className="flex-1">
            <MemoizedStationList
              stations={filteredStations}
              userLocation={location?.coords || { latitude: 38.736946, longitude: -9.142685 }}
              selectedFuelType={selectedFuelType}
              selectedStation={selectedStation}
              onScroll={handleScroll}
              onMeasureCardHeight={measureCardHeight}
              scrollViewRef={scrollViewRef}
              isLoading={isLoading || isFetchingMore}
            />
            <ResponsiveAdBanner testID="mainScreenBanner" />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}