import * as Location from 'expo-location';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  Easing,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions
} from 'react-native';

// Services & Types
import { PostoSortOption } from '@/types/models/PostoSortOption';
import { Posto } from '../../types/models/Posto';
import { StationService } from '../network/stationService';

// Components
import Header from '../components/Header';
import Map from '../components/Map/Map';
import StationList from '../components/StationList';
import StatusMessage from '../components/StatusMessage';
import { SearchHeader } from '../components/home/searchHeader';

// Contexts & Hooks
import { useAppContext } from '../context/AppContext';
import { useSearch } from '../context/SearchContext';

// Memoized Imports
const MemoizedHeader = React.memo(Header);
const MemoizedMap = React.memo(Map);
const MemoizedStatusMessage = React.memo(StatusMessage);

const HomeScreen = () => {
  // --- Layout Hooks ---
  const { width, height } = useWindowDimensions();
  const isPortrait = height >= width;

  // --- Refs ---
  const mapHeight = useRef(new Animated.Value(0.40)).current;
  const currentMapHeight = useRef(0.40);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const mapRef = useRef<any>(null);
  const cardHeights = useRef<number[]>([]);
  const lastFetchTime = useRef<number>(0);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAnimating = useRef(false);
  const mapReadyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Hooks ---
  const params = useLocalSearchParams();
  const { t } = useTranslation();
  
  const { 
    darkMode, 
    searchRadius, 
    selectedFuelTypes, 
    preferredNavigationApp,
    theme,
    excludedBrands // <--- NOVO: Importar marcas excluídas
  } = useAppContext();

  const { searchState, clearSearch: clearSearchContext, isSearchActive, setSearchState } = useSearch();

  // --- State ---
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Location State
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [isUserLocationReady, setIsUserLocationReady] = useState(false);
  
  // Data State
  const [allStations, setAllStations] = useState<Posto[]>([]);
  const [filteredStations, setFilteredStations] = useState<Posto[]>([]);
  
  const [selectedFuelType, setSelectedFuelType] = useState(selectedFuelTypes[0] || 'Gasóleo simples');
  const [selectedStation, setSelectedStation] = useState<Posto | null>(null);
  const [currentSort, setCurrentSort] = useState<PostoSortOption>('mais_barato');
  
  const [isMapReady, setIsMapReady] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const POLLING_INTERVAL = 60000;

  // --- Logic Helpers ---

  const inSearchMode = useMemo(() => {
    return !!searchState || params.searchType === 'location' || isSearchActive;
  }, [searchState, params.searchType, isSearchActive]);

  // --- NOVA LÓGICA DE FILTRAGEM ---
  // Este Effect corre sempre que os dados (allStations) ou as definições (excludedBrands) mudam
  useEffect(() => {
    if (allStations.length > 0) {
      const filtered = allStations.filter(station => {
        // Se a marca estiver na lista negra, remove
        if (excludedBrands.includes(station.marca)) {
          return false;
        }
        return true;
      });
      setFilteredStations(filtered);
    } else {
      setFilteredStations([]);
    }
  }, [allStations, excludedBrands]);
  // --------------------------------

  const stopLocationUpdates = useCallback(() => {
    if (locationSubscription.current) {
      try {
        locationSubscription.current.remove();
      } catch (e) {
        console.warn('Error safely removing location subscription', e);
      }
      locationSubscription.current = null;
    }
  }, []);

  const fetchAndFilterStations = useCallback(async (
    coords: Location.LocationObjectCoords, 
    forceFetch: boolean = false, 
    fuelTypeOverride?: string,
    isClearingSearch: boolean = false
  ) => {
    // Se estiver a limpar, IGNORA o bloqueio do inSearchMode
    if (inSearchMode && !isClearingSearch) return;
    
    if (isFetchingMore && !forceFetch) return;

    const now = Date.now();
    if (!forceFetch && now - lastFetchTime.current < POLLING_INTERVAL) return;
    if (forceFetch && now - lastFetchTime.current < 1000) return;

    setIsFetchingMore(true);
    lastFetchTime.current = now;

    const targetFuelType = fuelTypeOverride || selectedFuelType;

    try {
      const data = await StationService.getNearby({
        lat: coords.latitude,
        lng: coords.longitude,
        radius: searchRadius * 1000,
        fuelType: targetFuelType,
        sortBy: currentSort
      });
      
      // Atualiza o estado se não estiver em pesquisa OU se estiver a limpar
      if (!inSearchMode || isClearingSearch) {
        setAllStations(data);
        // O setFilteredStations será tratado pelo useEffect acima
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setErrorMsg(t('error.noInternet'));
      setAllStations([]);
    } finally {
      setIsFetchingMore(false);
    }
  }, [searchRadius, currentSort, isFetchingMore, selectedFuelType, inSearchMode, t]);

  // --- Handlers ---

  const handleFuelTypeChange = useCallback((fuelType: string) => {
    if (inSearchMode) {
        setSelectedFuelType(fuelType);
        return;
    }

    setSelectedFuelType(fuelType);
    setIsLoading(true); 
    // setFilteredStations([]); // Deixamos o effect tratar disto

    if (location) {
      fetchAndFilterStations(location.coords, true, fuelType).finally(() => {
        setIsLoading(false);
      });
    }
  }, [location, inSearchMode, fetchAndFilterStations]);

  const handleSortChange = useCallback((sort: PostoSortOption) => {
    if (isSearchActive && searchState) {
      const isPriceSort = sort === 'mais_caro' || sort === 'mais_barato';
      if (!isPriceSort) return; 

      const updatedSearchState = { ...searchState, sortBy: sort as any };
      setSearchState(updatedSearchState);
      setIsLoading(true);
      
      StationService.getByLocation({
        distrito: searchState.distrito,
        municipio: searchState.municipio,
        fuelType: searchState.fuelType,
        sortBy: sort as any
      })
      .then((data) => {
        setAllStations(data);
        // O useEffect tratará do filteredStations
      })
      .catch(() => setErrorMsg(t('error.noInternet')))
      .finally(() => setIsLoading(false));
      return;
    }

    if (location) {
      setIsLoading(true);
      // setFilteredStations([]); // Deixamos o effect tratar disto
      setCurrentSort(sort);

      StationService.getNearby({
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        radius: searchRadius * 1000,
        fuelType: selectedFuelType,
        sortBy: sort
      })
      .then((data) => {
        setAllStations(data);
      })
      .catch(() => setErrorMsg(t('error.noInternet')))
      .finally(() => setIsLoading(false));
    }
  }, [location, searchRadius, selectedFuelType, isSearchActive, searchState, setSearchState, t]);

  const handleClearSearch = useCallback(async () => {
    clearSearchContext();
    setSelectedStation(null);
    setAllStations([]);
    setFilteredStations([]);
    
    try {
      setIsFetchingMore(true);
      const initialLoc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocation(initialLoc);
      
      stopLocationUpdates();
      locationSubscription.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 10000, distanceInterval: 50 },
        (newLocation) => { setLocation(newLocation); }
      );

      await fetchAndFilterStations(initialLoc.coords, true, undefined, true);    
          
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: initialLoc.coords.latitude,
          longitude: initialLoc.coords.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }, 1000);
      }

    } catch (error) {
      setErrorMsg(t('error.locationError'));
    } finally {
      setIsFetchingMore(false);
    }
  }, [clearSearchContext, fetchAndFilterStations, stopLocationUpdates, t]);

  // --- Effects ---

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      try {
        setIsInitialLoading(false);

        if (inSearchMode && searchState) {
          stopLocationUpdates();
          
          setAllStations(searchState.results);
          // setFilteredStations(searchState.results); // O effect trata disto
          setSelectedFuelType(searchState.fuelType);
          setCurrentSort(searchState.sortBy as PostoSortOption);
          
          if (searchState.results.length > 0) {
             const first = searchState.results[0];
             const [lng, lat] = first.localizacao.coordinates;
             
             setLocation({ 
               coords: { 
                 latitude: lat, 
                 longitude: lng,
                 altitude: 0, accuracy: 0, altitudeAccuracy: 0, heading: 0, speed: 0 
               },
               timestamp: Date.now()
             });
          }
          
          setIsDataLoaded(true);
          return;
        }

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg(t('error.locationDenied'));
          setIsDataLoaded(true);
          return;
        }

        const initialLoc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setLocation(initialLoc);
        setIsUserLocationReady(true);

        stopLocationUpdates();
        locationSubscription.current = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, timeInterval: 10000, distanceInterval: 50 },
          (loc) => { if (isMounted) setLocation(loc); }
        );

        await fetchAndFilterStations(initialLoc.coords, true);
        if (isMounted) setIsDataLoaded(true);

      } catch (e) {
        if (isMounted) {
          setErrorMsg(t('error.locationError'));
          setIsDataLoaded(true);
        }
      }
    };

    initialize();

    return () => { 
      isMounted = false; 
      stopLocationUpdates(); 
    };
  }, [inSearchMode, searchState]); 

  useEffect(() => {
    if (location && isUserLocationReady && !inSearchMode && !isFetchingMore && isMapReady) {
      const now = Date.now();
      if (now - lastFetchTime.current >= POLLING_INTERVAL) {
        fetchAndFilterStations(location.coords, false);
      }
    }
  }, [location, isUserLocationReady, inSearchMode, isFetchingMore, isMapReady, fetchAndFilterStations]);

  useEffect(() => {
    if (location && !inSearchMode) {
      const now = Date.now();
      if (now - lastFetchTime.current >= POLLING_INTERVAL) {
        fetchAndFilterStations(location.coords, true);
      }
    }
  }, [searchRadius, selectedFuelType, currentSort, location, inSearchMode, fetchAndFilterStations]);

  useEffect(() => {
    if (!selectedFuelTypes.includes(selectedFuelType)) {
      setSelectedFuelType(selectedFuelTypes[0] || 'Gasóleo simples');
    }
  }, [selectedFuelTypes]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', darkMode);
    }
  }, [darkMode]);

  useEffect(() => {
    mapReadyTimeout.current = setTimeout(() => setIsMapReady(true), 1000);
    return () => { if (mapReadyTimeout.current) clearTimeout(mapReadyTimeout.current); };
  }, []);

  // --- Scroll & Map Helpers ---
  const handleMapReady = useCallback(() => setIsMapReady(true), []);
  
  const measureCardHeight = useCallback((index: number, height: number) => {
    cardHeights.current[index] = height;
  }, []);

  const handleScroll = useCallback((event: any) => {
    if (isAnimating.current) return;
    const offsetY = event.nativeEvent.contentOffset.y;
    const newMapHeight = offsetY > 30 ? 0.60 : 0.40;
    
    if (Math.abs(currentMapHeight.current - newMapHeight) > 0.01) {
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => {
        isAnimating.current = true;
        currentMapHeight.current = newMapHeight;
        Animated.timing(mapHeight, {
          toValue: newMapHeight, duration: 150, easing: Easing.out(Easing.ease), useNativeDriver: false
        }).start(() => { isAnimating.current = false; });
      }, 100);
    }
  }, [mapHeight]);

  const handleMarkerPress = useCallback((station: Posto | null) => {
    setSelectedStation(station);
    if (station) {
      const idx = filteredStations.findIndex(s => s.id === station.id);
      if (idx !== -1) {
        const totalHeight = cardHeights.current.slice(0, idx).reduce((sum, h) => sum + h, 0);
        const targetMapH = 0.60;
        
        if (currentMapHeight.current < targetMapH) {
          currentMapHeight.current = targetMapH;
          Animated.timing(mapHeight, { toValue: targetMapH, duration: 50, useNativeDriver: false }).start();
        }

        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            y: Math.max(0, totalHeight - ((height * (1 - targetMapH)) / 2) + 60),
            animated: true
          });
        }, 100);
      }
    }
  }, [filteredStations, mapHeight, height]);

  // --- Renders ---
  const mapComponent = useMemo(() => (
    <MemoizedMap
      ref={mapRef}
      stations={filteredStations}
      selectedStation={selectedStation}
      onMarkerPress={handleMarkerPress}
      userLocation={location?.coords || { latitude: 38.736946, longitude: -9.142685 }}
      isSearchActive={isSearchActive}
      searchRadius={isSearchActive ? 0 : searchRadius}
      selectedFuelType={selectedFuelType}
      style={isPortrait ? undefined : { flex: 1 }}
      onMapReady={handleMapReady}
      preferredNavigationApp={preferredNavigationApp}
    />
  ), [filteredStations, selectedStation, handleMarkerPress, location?.coords, isSearchActive, searchRadius, selectedFuelType, isPortrait, handleMapReady, preferredNavigationApp]);

  const stationListComponent = useMemo(() => (
    <StationList
      stations={filteredStations}
      userLocation={location?.coords || { latitude: 38.736946, longitude: -9.142685 }}
      selectedFuelType={selectedFuelType}
      selectedStation={selectedStation}
      preferredNavigationApp={preferredNavigationApp}
      onScroll={handleScroll}
      onMeasureCardHeight={measureCardHeight}
      scrollViewRef={scrollViewRef}
      isLoading={isLoading}
      onFuelTypeChange={!isSearchActive ? handleFuelTypeChange : undefined}
      onSelectSort={!isSearchActive ? handleSortChange : undefined}
      selectedSort={currentSort}
    />
  ), [filteredStations, location, selectedFuelType, selectedStation, preferredNavigationApp, isLoading, isSearchActive, handleFuelTypeChange, handleSortChange, currentSort]);

  if (isInitialLoading || (!isMapReady && !isSearchActive && !isDataLoaded)) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ color: theme.text, marginTop: 16 }}>{t('station.loading')}</Text>
      </View>
    );
  }

  if (errorMsg === t('error.noInternet')) {
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <Text style={{ color: theme.text, fontSize: 20, marginBottom: 8 }}>{t('error.noInternet')}</Text>
          <TouchableOpacity onPress={() => BackHandler.exitApp()} style={{ backgroundColor: theme.primary, padding: 12, borderRadius: 8 }}>
            <Text style={{ color: 'white' }}>{t('common.exit')}</Text>
          </TouchableOpacity>
        </SafeAreaView>
      );
  }

  return (
    <>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />
      <SafeAreaView style={{ flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, backgroundColor: theme.background }}>
        <MemoizedHeader />
        
        {isSearchActive && searchState && (
          <SearchHeader searchState={searchState} onClearSearch={handleClearSearch} />
        )}

        {isPortrait ? (
          <View className="flex-1">
            <Animated.View style={{ height: mapHeight.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }}>
              {mapComponent}
            </Animated.View>
            <View className="flex-1">{stationListComponent}</View>
          </View>
        ) : (
          <View className="flex-1 flex-row">
            <View className="w-[65%]">{mapComponent}</View>
            <View className="w-[35%]">{stationListComponent}</View>
          </View>
        )}

        {errorMsg && <MemoizedStatusMessage message={errorMsg} type="error" onClose={() => setErrorMsg(null)} />}
        
      </SafeAreaView>
    </>
  );
};

export default HomeScreen;