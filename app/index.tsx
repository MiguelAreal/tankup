import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, BackHandler, Easing, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useAppContext } from '../context/AppContext';
import stringsEN from './assets/strings.en.json';
import stringsPT from './assets/strings.pt.json';
import FuelTypeSelector from './components/FuelTypeSelector';
import Header from './components/Header';
import MapComponent from './components/Map/Map';
import PostoCard from './components/PostoCard';
import { Posto } from './types/models';
import { Strings } from './types/strings';
import { fetchNearbyStations } from './utils/api';
import { isWithinRadius } from './utils/location';

// Define types
export default function HomeScreen() {
  const mapHeight = useRef(new Animated.Value(0.60)).current;
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const mapRef = useRef<any>(null);
  const router = useRouter();
  const params = useLocalSearchParams();

  const { darkMode, searchRadius, language, selectedFuelTypes } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean>(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [allStations, setAllStations] = useState<Posto[]>([]);
  const [filteredStations, setFilteredStations] = useState<Posto[]>([]);
  const [selectedFuelType, setSelectedFuelType] = useState(selectedFuelTypes[0] || 'Gasóleo simples');
  const [, setBottomSheetVisible] = useState(false);
  const [selectedStation, setSelectedStation] = useState<Posto | null>(null);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchParams, setSearchParams] = useState<{
    distrito?: string;
    municipio?: string;
    fuelType?: string;
    sortBy?: 'mais_caro' | 'mais_barato' | 'mais_longe' | 'mais_perto';
  } | null>(null);

  const strings = (language === 'en' ? stringsEN : stringsPT) as Strings;

  // Update selectedFuelType when selectedFuelTypes changes
  useEffect(() => {
    if (selectedFuelTypes.length > 0 && !selectedFuelTypes.includes(selectedFuelType)) {
      setSelectedFuelType(selectedFuelTypes[0]);
    }
  }, [selectedFuelTypes]);

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
    if (offsetY > 30) {
      animateMapHeight(0.40);
    } else {
      animateMapHeight(0.60);
    }
  };

  // Start location updates
  const startLocationUpdates = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setHasLocationPermission(status === 'granted');
      
      if (status !== 'granted') {
        setErrorMsg('Location permission denied');
        setAllStations([]);
        setLoading(false);
        return;
      }

      // Get initial location
      const initialLocation = await Location.getCurrentPositionAsync({});
      setLocation(initialLocation);

      // Start watching position
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000, // Update every 10 seconds
          distanceInterval: 50, // Only update if moved 50 meters
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
    } finally {
      setLoading(false);
    }
  };

  // Fetch and filter stations with debouncing
  const fetchAndFilterStations = React.useCallback(async (location: Location.LocationObjectCoords) => {
    try {
      const data = await fetchNearbyStations<Posto[]>(
        location.latitude,
        location.longitude,
        searchRadius * 1000,
        selectedFuelType
      );
      
      setAllStations(data);
    } catch (error) {
      console.error('Error fetching stations:', error);
      setErrorMsg('No internet connection');
    }
  }, [searchRadius, selectedFuelType]);

  // Filter stations based on current location and search radius
  useEffect(() => {
    if (!location || !allStations.length) return;

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
      console.log(`Station ${station.idDgeg} (${station.nome}):`, {
        lat: stationLat,
        lng: stationLng,
        isWithin
      });
      return isWithin;
    });

    console.log('Filtered stations count:', filtered.length);
    console.log('Filtered stations:', filtered);
    setFilteredStations(filtered);
  }, [location, allStations, searchRadius]);

  // Initial setup
  useEffect(() => {
    startLocationUpdates();
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

  // Modify the fetchAndFilterStations effect to respect search state
  useEffect(() => {
    if (!location || isSearchActive) return;
    
    const timeoutId = setTimeout(() => {
      fetchAndFilterStations(location.coords);
    }, 1000); // Debounce for 1 second

    return () => clearTimeout(timeoutId);
  }, [selectedFuelType, location, fetchAndFilterStations, isSearchActive]);

  // Handle search results
  useEffect(() => {
    if (params.searchResults) {
      try {
        const results = JSON.parse(params.searchResults as string) as Posto[];
        setFilteredStations(results);
        setAllStations(results);
        setIsSearchActive(true);
        setSearchParams({
          distrito: params.distrito as string,
          municipio: params.municipio as string,
          fuelType: params.fuelType as string,
          sortBy: params.sortBy as 'mais_caro' | 'mais_barato' | 'mais_longe' | 'mais_perto'
        });
      } catch (error) {
        console.error('Error parsing search results:', error);
      }
    }
  }, [params]);

  // Clear search and resume normal operation
  const clearSearch = () => {
    setIsSearchActive(false);
    setSearchParams(null);
    if (location) {
      fetchAndFilterStations(location.coords);
    }
  };

  // Handle fuel type selection
  const handleFuelTypeChange = (fuelType: string) => {
    setSelectedFuelType(fuelType);
  };

  const handleSortChange = (sort: 'mais_caro' | 'mais_barato' | 'mais_longe' | 'mais_perto') => {
    if (isSearchActive && searchParams) {
      // If we're in search mode, update the search params and trigger a new search
      setSearchParams({
        ...searchParams,
        sortBy: sort as 'mais_caro' | 'mais_barato' // Only these two are supported by the API
      });
      // Trigger a new search with updated sort
      handleSearch(searchParams.distrito, searchParams.municipio, searchParams.fuelType, sort as 'mais_caro' | 'mais_barato');
    }
  };

  const handleSearch = async (distrito?: string, municipio?: string, fuelType?: string, sortBy?: 'mais_caro' | 'mais_barato') => {
    if (!distrito && !municipio) return;
    
    try {
      const results = await fetchNearbyStations<Posto[]>(
        location?.coords.latitude || 0,
        location?.coords.longitude || 0,
        searchRadius * 1000,
        fuelType || selectedFuelType
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
        // Calculate scroll position with padding to ensure card is fully visible
        const cardHeight = 180; // Approximate height of each station card including margins
        const scrollPosition = Math.max(0, (stationIndex * cardHeight) - 20); // Subtract some padding to show more context
        
        console.log('Scrolling to station at index:', stationIndex, 'position:', scrollPosition);
        scrollViewRef.current?.scrollTo({
          y: scrollPosition,
          animated: true
        });
      }
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

  // Render loading screen
  if (loading && !allStations.length) {
    return (
      <View className={`flex-1 items-center justify-center bg-slate-100 dark:bg-slate-900`}>
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
    <SafeAreaView className="flex-1 bg-slate-100 dark:bg-slate-900">
      <StatusBar style={darkMode ? "light" : "dark"} />

      {/* Header */}
      <Header />

      {/* Search Status and Clear Button */}
      {isSearchActive && (
        <View className="flex-row items-center justify-between px-4 py-2 bg-blue-50 dark:bg-blue-900/20">
          <View className="flex-1">
            <Text className="text-sm text-blue-600 dark:text-blue-400">
              {searchParams?.distrito && `${searchParams.distrito}`}
              {searchParams?.municipio && ` > ${searchParams.municipio}`}
            </Text>
            {searchParams?.fuelType && (
              <Text className="text-xs text-slate-600 dark:text-slate-400">
                {strings.station.fuelType[searchParams.fuelType as keyof typeof strings.station.fuelType]}
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={clearSearch}
            className="bg-blue-600 px-3 py-1 rounded-lg"
          >
            <Text className="text-white text-sm">
              {strings.search.clear}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Fuel Type Selector */}
      <View className="flex-none">
        <FuelTypeSelector 
          selectedFuelType={selectedFuelType} 
          onSelectFuelType={handleFuelTypeChange}
          selectedSort={searchParams?.sortBy || "mais_barato"}
          onSelectSort={handleSortChange}
        />
      </View>
      
      {/* Main Content Container with flexbox layout */}
      <View className="flex-1">
        {/* Map - Fixed height */}
        <Animated.View
          style={{
            height: mapHeight.interpolate({
              inputRange: [0.4, 0.6],
              outputRange: ['40%', '60%'],
            }),
            width: '100%',
          }}
        >
          <MapComponent
            mapRef={mapRef}
            stations={filteredStations}
            userLocation={location?.coords || { latitude: 38.736946, longitude: -9.142685 }}
            selectedFuelType={selectedFuelType}
            onMarkerPress={handleMarkerPress}
            searchRadius={isSearchActive ? 0 : searchRadius}
            allowInteraction={!isSearchActive}
          />
          
          <TouchableOpacity
            className="absolute bottom-4 right-4 bg-white dark:bg-slate-800 rounded-full p-3 shadow-md"
            onPress={() => setBottomSheetVisible(true)}
          >
            <Ionicons name="list" size={24} color="#2563eb" />
          </TouchableOpacity>
        </Animated.View>
        
        {/* Stations List with ScrollView - Takes remaining height */}
        <View className="flex-1 bg-slate-100 dark:bg-slate-900">
          <View className="p-4">
            <Text className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              {strings.station.cheapestNearby}
            </Text>
          </View>
          
          <ScrollView 
            ref={scrollViewRef}
            className="flex-1 px-4" 
            onScroll={handleScroll} 
            scrollEventThrottle={16}
          >
            {!hasLocationPermission ? (
              <View className="items-center justify-center py-10">
                <Text className="text-slate-600 dark:text-slate-400 text-center mb-4">
                  {strings.station.locationRequired}
                </Text>
                <Text className="text-slate-600 dark:text-slate-400 text-center">
                  {strings.station.useSearch}
                </Text>
              </View>
            ) : filteredStations.length > 0 ? (
              filteredStations.map((station) => (
                <Animated.View
                  key={station.idDgeg}
                  style={styles.stationCardContainer}
                >
                  <PostoCard
                    posto={station}
                    selectedFuelType={selectedFuelType}
                    userLocation={location?.coords || { latitude: 38.736946, longitude: -9.142685 }}
                  />
                </Animated.View>
              ))
            ) : (
              <View className="items-center justify-center py-10">
                <Text className="text-slate-600 dark:text-slate-400">
                  {strings.station.noStationsFound}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = {
  stationCardContainer: {
    marginBottom: 10,
  },
};