import Ionicons from '@expo/vector-icons/Ionicons';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Animated, BackHandler, Dimensions, Easing, Platform, SafeAreaView, ScaledSize, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { useAppContext } from '../context/AppContext';
import { Posto } from '../types/models';
import stringsEN from './assets/strings.en.json';
import stringsPT from './assets/strings.pt.json';
import FuelTypeSelector from './components/FuelTypeSelector';
import Header from './components/Header';
import Map from './components/Map/Map';
import ResponsiveAdBanner from './components/ResponsiveAdBanner';
import StationList from './components/StationList';
import StatusMessage from './components/StatusMessage';
import { useSearch } from './context/SearchContext';
import { useInterstitialAd } from './hooks/useInterstitialAd';
import { fetchNearbyStations, fetchStationsByLocation } from './utils/api';
type Strings = typeof stringsEN;

// Memoized components
const MemoizedHeader = React.memo(Header);
const MemoizedFuelTypeSelector = React.memo(FuelTypeSelector);
const MemoizedMap = React.memo(Map);
const MemoizedStationList = React.memo(StationList);
const MemoizedStatusMessage = React.memo(StatusMessage);

// Add this near the top of the file, after imports
const SearchHeader = React.memo(({ 
  searchState, 
  onClearSearch 
}: { 
  searchState: any; 
  onClearSearch: () => void;
}) => {
  const { theme, language } = useAppContext();
  const strings = (language === 'en' ? stringsEN : stringsPT) as Strings;

  return (
    <View style={{ backgroundColor: theme.background }} className="px-4 py-2 flex-row items-center justify-between">
      <View className="flex-row items-center flex-1">
        <Ionicons name="search" size={20} color={theme.primary} />
        <Text style={{ color: theme.text }} className="ml-2 flex-1">
          {searchState.municipio 
            ? `${searchState.municipio}, ${searchState.distrito}`
            : searchState.distrito}
        </Text>
      </View>
      <TouchableOpacity
        onPress={onClearSearch}
        className="ml-2 px-3 py-1 rounded-lg"
        style={{ backgroundColor: theme.primaryLight }}
      >
        <Text style={{ color: theme.primary }} className="font-medium">
          {strings.search.clear}
        </Text>
      </TouchableOpacity>
    </View>
  );
});

// Define types
const HomeScreen = () => {
  const mapHeight = useRef(new Animated.Value(0.40)).current;
  const currentMapHeight = useRef(0.40);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const mapRef = useRef<any>(null);
  const router = useRouter();
  const params = useLocalSearchParams();
  const cardHeights = useRef<number[]>([]);
  const { t } = useTranslation();
  const [dimensions, setDimensions] = useState(() => {
    const window = Dimensions.get('window');
    return {
      window,
      isPortrait: window.height >= window.width
    };
  });

  const { 
    darkMode, 
    searchRadius, 
    language, 
    selectedFuelTypes, 
    preferredNavigationApp,
    theme
  } = useAppContext();

  const { searchState, clearSearch: clearSearchContext, isSearchActive, setSearchState } = useSearch();

  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean>(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [allStations, setAllStations] = useState<Posto[]>([]);
  const [filteredStations, setFilteredStations] = useState<Posto[]>([]);
  const [selectedFuelType, setSelectedFuelType] = useState(selectedFuelTypes[0] || 'Gasóleo simples');
  const [selectedStation, setSelectedStation] = useState<Posto | null>(null);
  const [currentSort, setCurrentSort] = useState<'mais_caro' | 'mais_barato' | 'mais_longe' | 'mais_perto'>('mais_barato');
  const lastFetchTime = useRef<number>(0);
  const POLLING_INTERVAL = 60000; // 1 minute in milliseconds
  const { showAd } = useInterstitialAd();

  // Debounced orientation change handler
  const orientationChangeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAnimating = useRef(false);

  // Centralize search mode logic - SINGLE SOURCE OF TRUTH
  const inSearchMode = useMemo(() => {
    const isSearching = !!searchState || params.searchType === 'location' || isSearchActive;
    console.log('🔍 Search mode check:', { 
      hasSearchState: !!searchState, 
      searchType: params.searchType, 
      isSearchActive,
      finalResult: isSearching 
    });
    return isSearching;
  }, [searchState, params.searchType, isSearchActive]);

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const mapReadyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Memoized fetch and filter function
  const fetchAndFilterStations = useCallback(async (location: Location.LocationObjectCoords, forceFetch: boolean = false, fuelType?: string) => {
    // HARD BLOCK: never execute in search mode
    if (inSearchMode) {
      console.log('❌ [HARD BLOCK] fetchAndFilterStations - Blocked in search mode');
      return;
    }

    if (isFetchingMore && !forceFetch) {
      console.log('❌ fetchAndFilterStations - Blocked due to isFetchingMore');
      return;
    }

    const now = Date.now();
    if (!forceFetch && now - lastFetchTime.current < POLLING_INTERVAL) {
      console.log('❌ fetchAndFilterStations - Blocked due to polling interval', {
        timeSinceLastFetch: now - lastFetchTime.current,
        pollingInterval: POLLING_INTERVAL
      });
      return;
    }

    // Add a debounce for force fetches
    if (forceFetch && now - lastFetchTime.current < 1000) {
      console.log('❌ fetchAndFilterStations - Blocked due to force fetch debounce');
      return;
    }

    console.log('✅ fetchAndFilterStations - Starting fetch...', {
      forceFetch,
      fuelType,
      searchRadius,
      currentSort
    });
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
      
      // Double check we're still not in search mode
      if (!inSearchMode) {
        console.log('✅ fetchAndFilterStations - Updating data');
        setAllStations(data);
        setFilteredStations(data);
      } else {
        console.log('❌ fetchAndFilterStations - Update blocked, entered search mode');
      }
    } catch (error) {
      console.log('❌ fetchAndFilterStations - Error:', error);
      setErrorMsg('No internet connection');
      setAllStations([]);
      setFilteredStations([]);
    } finally {
      setIsFetchingMore(false);
      setIsLoading(false);
    }
  }, [searchRadius, currentSort, isFetchingMore, selectedFuelType, inSearchMode]);

  // Effect to handle location updates and initial fetch
  useEffect(() => {
    let isMounted = true;
    const initialize = async () => {
      try {
        // Start with a default location to show UI immediately
        const defaultLocation = {
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
        };
        
        // Set initial states immediately
        setLocation(defaultLocation);
        setIsInitialLoading(false);
        
        // Request location permission and get initial location in parallel
        const [locationPermission, initialLocation] = await Promise.all([
          Location.requestForegroundPermissionsAsync(),
          Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Lowest // Use lowest accuracy for fastest initial location
          })
        ]);
        
        if (!isMounted) return;
        
        setHasLocationPermission(locationPermission.status === 'granted');
        
        if (locationPermission.status !== 'granted') {
          setErrorMsg(t('error.locationDenied'));
          setAllStations([]);
          setIsDataLoaded(true);
          return;
        }

        // Update location with more accurate position
        setLocation(initialLocation);

        // Only fetch initial stations if not in search mode
        if (!inSearchMode) {
          // Start location subscription with low accuracy initially
          const newLocationSubscription = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Lowest,
              timeInterval: 10000,
              distanceInterval: 50,
            },
            (newLocation) => {
              if (!inSearchMode && isMounted) {
                setLocation(newLocation);
              }
            }
          );

          if (!isMounted) {
            newLocationSubscription.remove();
            return;
          }

          locationSubscription.current = newLocationSubscription;

          // Fetch stations
          try {
            const stationsData = await fetchNearbyStations<Posto[]>(
              initialLocation.coords.latitude,
              initialLocation.coords.longitude,
              searchRadius * 1000,
              selectedFuelType,
              currentSort
            );
            
            if (!isMounted) return;
            
            setAllStations(stationsData);
            setFilteredStations(stationsData);
            lastFetchTime.current = Date.now();
            setIsDataLoaded(true);

            // Center map on user location
            if (mapRef.current) {
              mapRef.current.animateToRegion({
                latitude: initialLocation.coords.latitude,
                longitude: initialLocation.coords.longitude,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              }, 500);
            }
          } catch (error) {
            console.error('Error fetching stations:', error);
            if (isMounted) {
              setErrorMsg(t('error.locationError'));
              setAllStations([]);
              setIsDataLoaded(true);
            }
          }
        } else {
          setIsDataLoaded(true);
        }
      } catch (error) {
        console.error('Error initializing:', error);
        if (isMounted) {
          setErrorMsg(t('error.locationError'));
          setAllStations([]);
          setIsDataLoaded(true);
        }
      }
    };

    initialize();

    return () => {
      isMounted = false;
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
      }
    };
  }, [inSearchMode]);

  // Effect to handle location changes and refetch
  useEffect(() => {
    if (location && !inSearchMode && !isFetchingMore) {
      const now = Date.now();
      if (now - lastFetchTime.current >= POLLING_INTERVAL) {
        console.log('🔄 Location changed, triggering fetch');
        fetchAndFilterStations(location.coords, false);
      } else {
        console.log('⏳ Location changed but polling interval not reached', {
          timeSinceLastFetch: now - lastFetchTime.current,
          pollingInterval: POLLING_INTERVAL
        });
      }
    }
  }, [location, inSearchMode, isFetchingMore, fetchAndFilterStations]);

  // Effect to handle settings changes
  useEffect(() => {
    if (location && !inSearchMode) {
      const now = Date.now();
      // Only force fetch if enough time has passed since last fetch
      if (now - lastFetchTime.current >= POLLING_INTERVAL) {
        console.log('⚙️ Settings changed, forcing fetch');
        fetchAndFilterStations(location.coords, true);
      } else {
        console.log('⏳ Settings changed but polling interval not reached', {
          timeSinceLastFetch: now - lastFetchTime.current,
          pollingInterval: POLLING_INTERVAL
        });
      }
    }
  }, [searchRadius, selectedFuelType, currentSort, location, inSearchMode, fetchAndFilterStations]);

  // Effect to update selected fuel type when selectedFuelTypes changes
  useEffect(() => {
    if (!selectedFuelTypes.includes(selectedFuelType)) {
      setSelectedFuelType(selectedFuelTypes[0] || 'Gasóleo simples');
    }
  }, [selectedFuelTypes]);

  // Effect to handle dark mode changes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', darkMode);
    }
  }, [darkMode]);

  // Memoized handlers
  const handleFuelTypeChange = useCallback((fuelType: string) => {
    if (inSearchMode) {
      console.log('❌ [BLOCK] handleFuelTypeChange - Blocked in search mode');
      return;
    }

    setSelectedFuelType(fuelType);
    setIsLoading(true);
    setFilteredStations([]);

    if (location) {
      fetchAndFilterStations(location.coords, true, fuelType);
      showAd();
    }
  }, [location, showAd, inSearchMode, fetchAndFilterStations]);

  const handleSortChange = useCallback((sort: 'mais_caro' | 'mais_barato' | 'mais_longe' | 'mais_perto') => {
    if (isSearchActive) {
      // In search mode, use the location API
      if (searchState && 'distrito' in searchState && 'municipio' in searchState && 'fuelType' in searchState) {
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
      }
      return;
    }

    // Normal mode (nearby)
    if (location) {
      setIsLoading(true);
      setFilteredStations([]);
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
  }, [location, searchRadius, selectedFuelType, isSearchActive, searchState, setSearchState]);

  const handleMarkerPress = useCallback((station: Posto | null) => {
    setSelectedStation(station);
    if (station) {
      const stationIndex = filteredStations.findIndex(s => s.id === station.id);
      
      if (stationIndex !== -1) {
        // Calculate the total height of all cards before the target station
        const totalHeightBeforeTarget = cardHeights.current
          .slice(0, stationIndex)
          .reduce((sum, height) => sum + height, 0);
        
        // Get the current map height percentage
        const mapHeightPercent = currentMapHeight.current;
        
        // Calculate the visible area height (screen height minus map height)
        const screenHeight = Dimensions.get('window').height;
        const mapHeight = screenHeight * mapHeightPercent;
        const visibleArea = screenHeight - mapHeight;
        
        // Calculate the optimal scroll position to center the target card
        const scrollPosition = Math.max(0, totalHeightBeforeTarget - (visibleArea / 2) + 60); // 60 is header height
        
        // Animate map height if needed
        if (mapHeightPercent < 0.60) {
          currentMapHeight.current = 0.60;
          animateMapHeight(0.60);
        }
        
        // Scroll to the station with a slight delay to ensure smooth animation
        setTimeout(() => {
          if (scrollViewRef.current) {
            scrollViewRef.current.scrollTo({
              y: scrollPosition,
              animated: true
            });
          }
        }, 100);
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
    if (isAnimating.current) return;

    const offsetY = event.nativeEvent.contentOffset.y;
    const newMapHeight = offsetY > 30 ? 0.60 : 0.40;
    
    if (Math.abs(currentMapHeight.current - newMapHeight) > 0.01) {
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }

      scrollTimeout.current = setTimeout(() => {
        isAnimating.current = true;
        currentMapHeight.current = newMapHeight;
        
        Animated.timing(mapHeight, {
          toValue: newMapHeight,
          duration: 150,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }).start(() => {
          isAnimating.current = false;
        });
      }, 100);
    }
  }, [mapHeight]);

  const measureCardHeight = useCallback((index: number, height: number) => {
    cardHeights.current[index] = height;
  }, []);

  const handleClearSearch = useCallback(async () => {
    if (isSearchActive) {
      console.log('❌ [BLOCK] clearSearch - Cleaning up search mode first');
      clearSearchContext();
      setSelectedStation(null);
      setAllStations([]);
      setFilteredStations([]);
      // Wait for the next cycle to ensure we're out of search mode
      return;
    }

    try {
      setIsFetchingMore(true);
      
      // Restart location updates if they were stopped
      if (!locationSubscription.current) {
        locationSubscription.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 10000,
            distanceInterval: 50,
          },
          (newLocation) => {
            if (!isSearchActive) {
              setLocation(newLocation);
            }
          }
        );
      }

      if (location) {
        const data = await fetchNearbyStations<Posto[]>(
          location.coords.latitude,
          location.coords.longitude,
          searchRadius * 1000,
          selectedFuelType,
          currentSort
        );

        if (!isSearchActive) {
          setAllStations(data);
          setFilteredStations(data);
          
          if (mapRef.current) {
            mapRef.current.animateToRegion({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }, 1000);
          }
        }
      }
    } catch (error) {
      setErrorMsg(t('error.noInternet'));
    } finally {
      setIsFetchingMore(false);
    }
  }, [location, searchRadius, selectedFuelType, currentSort, clearSearchContext, isSearchActive, t]);

  // Memoized animation function
  const animateMapHeight = useCallback((toValue: number) => {
    Animated.timing(mapHeight, {
      toValue,
      duration: 50,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  }, [mapHeight]);

  const handleCardLayout = (index: number, height: number) => {
    cardHeights.current[index] = height;
  };

  // Effect to handle search state changes
  useEffect(() => {
    if (searchState) {
      console.log('🔍 Search state updated, updating stations');
      setAllStations(searchState.results);
      setFilteredStations(searchState.results);
      setSelectedFuelType(searchState.fuelType);
      setCurrentSort(searchState.sortBy);

      // Clean up location subscription when entering search mode
      if (locationSubscription.current) {
        console.log('🔄 Cleaning up location subscription for search mode');
        locationSubscription.current.remove();
        locationSubscription.current = null;
      }
    }
  }, [searchState]);

  // Add map ready handler with shorter timeout
  const handleMapReady = useCallback(() => {
    console.log('Map is ready');
    setIsMapReady(true);
  }, []);

  // Effect to handle map ready timeout
  useEffect(() => {
    // Set a timeout to force map ready after 1 second
    mapReadyTimeout.current = setTimeout(() => {
      console.log('Map ready timeout reached');
      setIsMapReady(true);
    }, 1000);

    return () => {
      if (mapReadyTimeout.current) {
        clearTimeout(mapReadyTimeout.current);
      }
    };
  }, []);

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
  }, [location]);

  // Update dimensions on rotation with debounce
  useEffect(() => {
    const onChange = ({ window }: { window: ScaledSize }) => {
      if (orientationChangeTimeout.current) {
        clearTimeout(orientationChangeTimeout.current);
      }

      orientationChangeTimeout.current = setTimeout(() => {
        setDimensions({
          window,
          isPortrait: window.height >= window.width
        });
      }, 50); // Small delay to ensure smooth transition
    };

    const subscription = Dimensions.addEventListener('change', ({ window, screen }) => onChange({ window }));

    return () => {
      if (orientationChangeTimeout.current) {
        clearTimeout(orientationChangeTimeout.current);
      }
      subscription.remove();
    };
  }, []);

  // Memoize the map component to prevent unnecessary re-renders
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
      style={dimensions.isPortrait ? undefined : { flex: 1 }}
      onMapReady={handleMapReady}
    />
  ), [
    filteredStations,
    selectedStation,
    handleMarkerPress,
    location?.coords,
    isSearchActive,
    searchRadius,
    selectedFuelType,
    dimensions.isPortrait,
    handleMapReady
  ]);

  // Memoize the station list component
  const stationListComponent = useMemo(() => (
    <MemoizedStationList
      stations={filteredStations}
      userLocation={location?.coords || { latitude: 38.736946, longitude: -9.142685 }}
      selectedFuelType={selectedFuelType}
      selectedStation={selectedStation}
      onScroll={handleScroll}
      onMeasureCardHeight={measureCardHeight}
      scrollViewRef={scrollViewRef}
      isLoading={isLoading}
      onFuelTypeChange={!isSearchActive ? handleFuelTypeChange : undefined}
      onSelectSort={!isSearchActive ? handleSortChange : undefined}
      selectedSort={currentSort}
    />
  ), [
    filteredStations,
    location?.coords,
    selectedFuelType,
    selectedStation,
    handleScroll,
    measureCardHeight,
    isLoading,
    handleFuelTypeChange,
    handleSortChange,
    currentSort,
    isSearchActive
  ]);

  // Memoize the portrait layout
  const portraitLayout = useMemo(() => (
    <View className="flex-1">
      <Animated.View
        style={{
          height: mapHeight.interpolate({
            inputRange: [0, 1],
            outputRange: ['0%', '100%'],
          }),
        }}
      >
        {mapComponent}
      </Animated.View>
      <View className="flex-1">
        {stationListComponent}
      </View>
    </View>
  ), [mapHeight, mapComponent, stationListComponent]);

  // Memoize the landscape layout
  const landscapeLayout = useMemo(() => (
    <View className="flex-1 flex-row">
      <View className="w-[65%]">
        {mapComponent}
      </View>
      <View className="w-[35%]">
        {stationListComponent}
      </View>
    </View>
  ), [mapComponent, stationListComponent]);

  // Update loading screen to check both map and data
  if (isInitialLoading || (!isMapReady && !isSearchActive && !isDataLoaded)) {
    console.log('Loading state:', { isInitialLoading, isMapReady, isDataLoaded, isSearchActive });
    return (
      <>
        <StatusBar 
          barStyle={darkMode ? 'light-content' : 'dark-content'}
          translucent={true}
          backgroundColor="transparent"
        />
        <SafeAreaView 
          className="flex-1 items-center justify-center"
          style={{ 
            paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
            backgroundColor: theme.background
          }}
        >
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={{ color: theme.text }} className="mt-4 text-lg font-medium text-center">
            {t('station.loading')}
          </Text>
        </SafeAreaView>
      </>
    );
  }

  // Render error screen
  if (errorMsg === t('error.noInternet')) {
    return (
      <>
        <StatusBar 
          barStyle={darkMode ? 'light-content' : 'dark-content'}
          translucent={true}
          backgroundColor="transparent"
        />
        <SafeAreaView 
          className="flex-1 items-center justify-center p-4"
          style={{ 
            paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
            backgroundColor: theme.background
          }}
        >
          <Text style={{ color: theme.text }} className="text-xl font-semibold text-center mb-4">
            {t('error.noInternet')}
          </Text>
          <Text style={{ color: theme.textSecondary }} className="text-center mb-8">
            {t('error.checkConnection')}
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: theme.primary }}
            className="px-6 py-3 rounded-lg"
            onPress={() => BackHandler.exitApp()}
          >
            <Text className="text-white font-medium">{t('common.exit')}</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </>
    );
  }

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
        <MemoizedHeader />

        {/* Search Header (only shown when in search mode) */}
        {isSearchActive && searchState && (
          <SearchHeader
            searchState={searchState}
            onClearSearch={handleClearSearch}
          />
        )}

        {/* Main Content */}
        {dimensions.isPortrait ? portraitLayout : landscapeLayout}

        {/* Status Message */}
        {errorMsg && (
          <MemoizedStatusMessage
            message={errorMsg}
            type="error"
            onClose={() => setErrorMsg(null)}
          />
        )}

        {/* Ad Banner */}
        <ResponsiveAdBanner />
      </SafeAreaView>
    </>
  );
};

export default HomeScreen;