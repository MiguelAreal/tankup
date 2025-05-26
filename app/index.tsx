import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, BackHandler, Easing, Platform, SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { useAppContext } from '../context/AppContext';
import stringsEN from './assets/strings.en.json';
import stringsPT from './assets/strings.pt.json';
import FuelTypeSelector from './components/FuelTypeSelector';
import Header from './components/Header';
import MapComponent from './components/Map/Map';
import StationList from './components/StationList';
import StatusMessage from './components/StatusMessage';
import { Posto } from './types/models';
import { Strings } from './types/strings';
import { fetchNearbyStations, fetchStationsByLocation } from './utils/api';
import { isWithinRadius } from './utils/location';

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

  const strings = (language === 'en' ? stringsEN : stringsPT) as Strings;

  // Fetch and filter stations with debouncing
  const fetchAndFilterStations = React.useCallback(async (location: Location.LocationObjectCoords, forceFetch: boolean = false, fuelType?: string) => {
    if (isFetchingMore && !forceFetch) return; // Prevent multiple simultaneous fetches unless forced
    
    const now = Date.now();
    if (!isSearchActive && !forceFetch && now - lastFetchTime.current < POLLING_INTERVAL) {
      return; // Skip if not enough time has passed since last fetch and not forced
    }
    
    setIsFetchingMore(true);
    lastFetchTime.current = now;
    
    const currentFuelType = fuelType || selectedFuelType;
    
    console.log('Fetching stations with params:', {
      lat: location.latitude,
      lng: location.longitude,
      radius: searchRadius * 1000,
      fuelType: currentFuelType,
      sortBy: currentSort
    });

    try {
      const data = await fetchNearbyStations<Posto[]>(
        location.latitude,
        location.longitude,
        searchRadius * 1000,
        currentFuelType,
        currentSort
      );
      
      console.log('Received stations:', data.length);
      setAllStations(data);
      setFilteredStations(data); // Set filtered stations immediately
    } catch (error) {
      console.error('Error fetching stations:', error);
      setErrorMsg('No internet connection');
      setAllStations([]);
      setFilteredStations([]);
    } finally {
      console.log('Fetch complete, setting isFetchingMore to false');
      setIsFetchingMore(false);
      setIsLoading(false);
    }
  }, [searchRadius, currentSort, isFetchingMore, isSearchActive, selectedFuelType, location]);

  // Handle search state changes
  useEffect(() => {
    if (searchState) {
      setIsSearchActive(true);
      setAllStations(searchState.results);
      setFilteredStations(searchState.results);
      setSelectedFuelType(searchState.fuelType);
      setCurrentSort(searchState.sortBy);
    } else {
      setIsSearchActive(false);
      // Reset to normal mode
      if (location) {
        fetchAndFilterStations(location.coords);
      }
    }
  }, [searchState]);

  const animateMapHeight = (toValue: number) => {
    Animated.timing(mapHeight, {
      toValue,
      duration: 50,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  };

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const newMapHeight = offsetY > 30 ? 0.40 : 0.60;
    
    // Only animate map height if it's different from current value
    if (Math.abs(currentMapHeight.current - newMapHeight) > 0.01) {
      currentMapHeight.current = newMapHeight;
      Animated.timing(mapHeight, {
        toValue: newMapHeight,
        duration: 50,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();
    }
  };

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

        // Get initial location
        const initialLocation = await Location.getCurrentPositionAsync({});
        setLocation(initialLocation);

        // Start watching position
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
        console.error('Location error:', error);
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
          console.log('Error removing location subscription:', error);
        }
      }
    };
  }, []);

  // Effect to fetch stations when location changes
  useEffect(() => {
    if (!location || isSearchActive) return;
    
    console.log('Location changed, fetching stations...');
    fetchAndFilterStations(location.coords);
  }, [location, isSearchActive, fetchAndFilterStations]);

  // Filter stations based on current location and search radius
  useEffect(() => {
    if (!location || !allStations.length || isSearchActive || isFetchingMore) return;

    console.log('=== Station Filtering Debug ===');
    console.log('Search radius:', searchRadius, 'km');
    console.log('User location:', {
      lat: location.coords.latitude,
      lng: location.coords.longitude
    });
    console.log('Total stations before filtering:', allStations.length);
    
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

    console.log('Filtered stations count:', filtered.length);
    setFilteredStations(filtered);
  }, [location, allStations, searchRadius, isSearchActive, isFetchingMore]);

  // Handle search results
  useEffect(() => {
    if (params.searchType === 'location' && !isSearchActive) {
      console.log('Starting search with params:', params);
      setIsSearchActive(true);
      setSearchState({
        results: [],
        searchType: 'location',
        distrito: params.distrito as string,
        municipio: params.municipio as string,
        fuelType: params.fuelType as string,
        sortBy: params.sortBy as 'mais_caro' | 'mais_barato'
      });

      // Fetch stations based on search parameters
      setIsFetchingMore(true);
      fetchStationsByLocation({
        distrito: params.distrito as string,
        municipio: params.municipio as string,
        fuelType: params.fuelType as string || selectedFuelType,
        sortBy: (params.sortBy as 'mais_caro' | 'mais_barato') || 'mais_barato'
      }).then((data: Posto[]) => {
        console.log('Search results received:', data.length, 'stations');
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

        // Wait for the next render cycle to ensure stations are loaded
        setTimeout(() => {
          // Center map on first station if available
          if (data.length > 0 && mapRef.current) {
            const [lng, lat] = data[0].localizacao.coordinates;
            console.log('Centering map on first station:', { lat, lng });
            
            if (Platform.OS === 'web') {
              // For web (Leaflet)
              try {
                console.log('Attempting to center map with Leaflet');
                const map = mapRef.current;
                if (map && typeof map.setView === 'function') {
                  map.setView([lat, lng], 13, {
                    animate: true,
                    duration: 1
                  });
                  console.log('Map centering command sent');
                } else {
                  console.error('Map reference is not properly initialized');
                }
              } catch (error) {
                console.error('Error centering map:', error);
              }
            } else {
              // For native (react-native-maps)
              try {
                const map = mapRef.current;
                if (map && typeof map.animateToRegion === 'function') {
                  map.animateToRegion({
                    latitude: lat,
                    longitude: lng,
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02,
                  }, 1000);
                } else {
                  console.error('Map reference is not properly initialized');
                }
              } catch (error) {
                console.error('Error centering map:', error);
              }
            }
          } else {
            console.log('Cannot center map:', {
              hasData: data.length > 0,
              hasMapRef: !!mapRef.current
            });
          }
        }, 500); // Increased delay to ensure map is ready
      }).catch((error: Error) => {
        console.error('Error fetching stations:', error);
        setErrorMsg('No internet connection');
        setIsFetchingMore(false);
      });
    }
  }, [params.searchType, params.distrito, params.municipio, params.fuelType, params.sortBy, isSearchActive]);

  // Clear search and resume normal operation
  const clearSearch = async () => {
    console.log('Starting clear search...');
    
    // Reset all search-related states
    setIsSearchActive(false);
    setFilteredStations([]);
    setAllStations([]);
    setIsFetchingMore(true);
    
    // Reset selected station
    setSelectedStation(null);
    
    // Clear search state from context
    clearSearchContext();
    
    // Resume normal operation with nearby stations
    if (location) {
      console.log('Fetching nearby stations after clearing search...');
      try {
        const data = await fetchNearbyStations<Posto[]>(
          location.coords.latitude,
          location.coords.longitude,
          searchRadius * 1000,
          selectedFuelType,
          'mais_barato'
        );
        
        console.log('Received stations after clearing:', data.length);
        setAllStations(data);
        setFilteredStations(data);
      } catch (error) {
        console.error('Error fetching stations after clearing:', error);
        setErrorMsg('No internet connection');
      } finally {
        setIsFetchingMore(false);
      }
    }
  };

  // Handle fuel type selection
  const handleFuelTypeChange = (fuelType: string) => {
    console.log('=== Fuel Type Change Debug ===');
    console.log('Previous fuel type:', selectedFuelType);
    console.log('New fuel type:', fuelType);
    setSelectedFuelType(fuelType);
    setIsLoading(true); // Show loading immediately
    setFilteredStations([]); // Clear current stations while loading
    if (!isSearchActive && location) {
      fetchAndFilterStations(location.coords, true, fuelType); // Pass the new fuel type directly
    }
  };

  // Handle sort change
  const handleSortChange = (sort: 'mais_caro' | 'mais_barato' | 'mais_longe' | 'mais_perto') => {
    console.log('Sort changed to:', sort);
    
    // Set loading state immediately
    setIsLoading(true);
    setFilteredStations([]); // Clear current stations while loading
    
    if (isSearchActive && searchState) {
      // In search mode, update search state and fetch new results
      const updatedSearchState = {
        ...searchState,
        sortBy: sort as 'mais_caro' | 'mais_barato'
      };
      setSearchState(updatedSearchState);
      
      // Fetch new results with updated sort
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
        console.error('Error fetching sorted stations:', error);
        setErrorMsg('No internet connection');
        setIsLoading(false);
      });
    } else if (location) {
      // In normal mode, fetch nearby stations with new sort
      console.log('Fetching nearby stations with sort:', sort);
      // Update currentSort after the API call is made
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
        console.error('Error fetching sorted stations:', error);
        setErrorMsg('No internet connection');
        setIsLoading(false);
      });
    }
  };

  const handleSearch = async (distrito?: string, municipio?: string, fuelType?: string, sortBy?: 'mais_caro' | 'mais_barato' | 'mais_longe' | 'mais_perto') => {
    if (!distrito && !municipio) return;
    
    try {
      const results = await fetchNearbyStations<Posto[]>(
        location?.coords.latitude || 0,
        location?.coords.longitude || 0,
        searchRadius * 1000,
        fuelType || selectedFuelType,
        sortBy || 'mais_barato'
      );
      
      setFilteredStations(results);
      setAllStations(results);
    } catch (error) {
      console.error('Error searching stations:', error);
    }
  };

  // Handle marker press
  const handleMarkerPress = (station: Posto | null) => {
    setSelectedStation(station);
    if (station) {
      // Find the index of the station in the sorted list
      const stationIndex = filteredStations.findIndex(s => s.idDgeg === station.idDgeg);
      console.log('Station index in list:', stationIndex);
      
      if (stationIndex !== -1) {
        // Calculate the total height up to the target card
        const headerHeight = 60;
        const mapHeightPercent = 0.60; // Full map height
        const screenHeight = window.innerHeight;
        const mapHeight = screenHeight * mapHeightPercent;
        
        // Calculate the exact position we want to reach
        const targetPosition = cardHeights.current
          .slice(0, stationIndex)
          .reduce((sum, height) => sum + height, 0);
        
        // Calculate the visible area after map
        const visibleArea = screenHeight - mapHeight;
        
        // Calculate the scroll position that will center the card in the visible area
        const scrollPosition = Math.max(0, targetPosition - (visibleArea / 2) + headerHeight);
        
        console.log('Scrolling to station:', {
          stationIndex,
          targetPosition,
          visibleArea,
          scrollPosition,
          cardHeights: cardHeights.current
        });

        // First, ensure map is expanded
        currentMapHeight.current = mapHeightPercent;
        animateMapHeight(0.60);
        setTimeout(() => {
          // After map animation completes, scroll to the station
          if (scrollViewRef.current) {
            scrollViewRef.current.scrollTo({
              y: scrollPosition,
              animated: true
            });
          }
        }, 50);
      }
    }
  };

  // Measure card heights when stations are rendered
  const measureCardHeight = (index: number, height: number) => {
    cardHeights.current[index] = height;
  };

  const handleNavigate = (station: Posto) => {
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
      window.open(url, '_blank');
    }
  };

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
        // For web (Leaflet)
        try {
          const map = mapRef.current;
          if (map && typeof map.setView === 'function') {
            map.setView([location.coords.latitude, location.coords.longitude], 13, {
              animate: true,
              duration: 1
            });
          }
        } catch (error) {
          console.error('Error centering map on location:', error);
        }
      } else {
        // For native (react-native-maps)
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
          console.error('Error centering map on location:', error);
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
          {strings.station.loading}
        </Text>
      </View>
    );
  }

  // Render error screen
  if (errorMsg === 'No internet connection') {
    return (
      <View className="flex-1 items-center justify-center bg-slate-100 dark:bg-slate-900 p-4">
        <Text className="text-xl font-semibold text-slate-800 dark:text-slate-200 text-center mb-4">
          No internet connection
        </Text>
        <Text className="text-slate-600 dark:text-slate-400 text-center mb-8">
          Please check your connection and try again.
        </Text>
        <TouchableOpacity
          className="bg-blue-600 px-6 py-3 rounded-lg"
          onPress={() => BackHandler.exitApp()}
        >
          <Text className="text-white font-medium">Exit App</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <Header />

      {errorMsg && (
        <StatusMessage 
          message={strings.status.error}
          type="error"
        />
      )}

      {!hasLocationPermission ? (
        <StatusMessage 
          message={strings.status.locationPermissionDenied}
          type="warning"
        />
      ) : !isSearchActive && filteredStations.length === 0 && !isLoading ? (
        <StatusMessage 
          message={strings.status.noStationsFound}
          type="info"
        />
      ) : (
        <>
          {/* Search Header */}
          {isSearchActive && searchState && (
            <View className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <View className="flex-row items-center justify-between px-4 py-3">
                <View className="flex-1">
                  <Text className="text-base font-medium text-slate-800 dark:text-slate-200">
                    {searchState.distrito && `${searchState.distrito}`}
                    {searchState.municipio && `, ${searchState.municipio}`}
                  </Text>
                  <Text className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {strings.station.fuelType[selectedFuelType as keyof typeof strings.station.fuelType]}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={clearSearch}
                  className="flex-row items-center bg-blue-50 dark:bg-blue-900/30 px-3 py-2 rounded-full"
                >
                  <Ionicons name="close-circle" size={16} color="#3b82f6" />
                  <Text className="text-blue-600 dark:text-blue-400 text-sm font-medium ml-1">
                    Limpar pesquisa
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Fuel Type Selector - Only show when not in search mode */}
          {!isSearchActive && (
            <View className="flex-none">
              <FuelTypeSelector 
                selectedFuelType={selectedFuelType} 
                onSelectFuelType={handleFuelTypeChange}
                selectedSort={currentSort}
                onSelectSort={handleSortChange}
              />
            </View>
          )}

          {/* Map in the middle */}
          <Animated.View style={{ height: mapHeight.interpolate({
            inputRange: [0, 1],
            outputRange: ['0%', '80%']
          })}}>
            <MapComponent
              mapRef={mapRef}
              stations={isSearchActive ? allStations : filteredStations}
              userLocation={location?.coords || { latitude: 38.736946, longitude: -9.142685 }}
              onMarkerPress={handleMarkerPress}
              selectedStation={selectedStation}
              selectedFuelType={selectedFuelType}
              searchRadius={isSearchActive ? 0 : searchRadius}
            />
          </Animated.View>

          {/* Bottom List */}
          <StationList
            stations={filteredStations}
            userLocation={location?.coords || { latitude: 38.736946, longitude: -9.142685 }}
            selectedFuelType={selectedFuelType}
            selectedStation={selectedStation}
            onScroll={handleScroll}
            onMeasureCardHeight={measureCardHeight}
            scrollViewRef={scrollViewRef}
            isLoading={isLoading || isFetchingMore}
          />
        </>
      )}
    </SafeAreaView>
  );
}