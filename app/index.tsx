import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppContext } from '../context/AppContext';
import FuelTypeSelector from './components/FuelTypeSelector';
import Header from './components/Header';
import MapComponent from './components/Map/Map';
import { Station } from './components/Map/Map.types';
import StationCard from './components/StationCard';
import { fetchNearbyStations } from './utils/api';
import { isWithinRadius } from './utils/location';

// Define types
export default function HomeScreen() {
  const mapHeight = useRef(new Animated.Value(0.60)).current;
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const mapRef = useRef<any>(null);
  const [highlightedStationId, setHighlightedStationId] = useState<string | null>(null);
  const highlightAnimation = useRef(new Animated.Value(0)).current;

  const { darkMode, searchRadius } = useContext(AppContext);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [allStations, setAllStations] = useState<Station[]>([]);
  const [filteredStations, setFilteredStations] = useState<Station[]>([]);
  const [selectedFuelType, setSelectedFuelType] = useState('Diesel');
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);

  // Mock data for stations to use when API fails or for development
  const mockStations: Station[] = [
    {
      id: '1',
      name: 'Posto Galp - Maia',
      brand: 'Galp',
      address: 'R. Agostinho da Silva Rocha s/n, 4475-451 Maia',
      distance: 0.8,
      latitude: 41.231955,
      longitude: -8.591402,
      fuels: [
        { type: 'Gasolina 95', price: 1.699 },
        { type: 'Gasolina 98', price: 1.849 },
        { type: 'Diesel', price: 1.499 },
        { type: 'GPL', price: 1.579 },
        { type: 'Elétrico', price: 0.5 }
      ],
    },
    {
      id: '2',
      name: 'Posto BP - Arroios',
      brand: 'BP',
      address: 'Av. Almirante Reis 156, Lisboa',
      distance: 1.2,
      latitude: 38.736946,
      longitude: -9.142685,
      fuels: [
        { type: 'Gasolina 95', price: 1.689 },
        { type: 'Gasolina 98', price: 1.839 },
        { type: 'Diesel', price: 1.489 },
        { type: 'GPL', price: 1.569 },
        { type: 'Elétrico', price: 0.5 }
      ],
    },
    {
      id: '3',
      name: 'Posto Repsol - Entrecampos',
      brand: 'Repsol',
      address: 'Av. 5 de Outubro 207, Lisboa',
      distance: 1.5,
      latitude: 38.744659,
      longitude: -9.149404,
      fuels: [
        { type: 'Gasolina 95', price: 1.709 },
        { type: 'Gasolina 98', price: 1.859 },
        { type: 'Diesel', price: 1.509 },
        { type: 'GPL', price: 1.589 },
        { type: 'Elétrico', price: 0.5 }
      ],
    }, {
      id: '4',
      name: 'Posto Repsol - Entrecampos',
      brand: 'Repsol',
      address: 'Av. 5 de Outubro 207, Lisboa',
      distance: 1.5,
      latitude: 38.744659,
      longitude: -9.149404,
      fuels: [
        { type: 'Gasolina 95', price: 1.709 },
        { type: 'Gasolina 98', price: 1.859 },
        { type: 'Diesel', price: 1.509 },
        { type: 'GPL', price: 1.589 },
        { type: 'Elétrico', price: 0.5 }
      ],
    }, {
      id: '5',
      name: 'Posto Prio - Maia',
      brand: 'Prio',
      address: 'R. Dr. Joaquim Nogueira dos Santos 60, 4475-498 Maia',
      distance: 1.5,
      latitude: 41.228779,
      longitude: -8.582320,
      fuels: [
        { type: 'Gasolina 95', price: 1.709 },
        { type: 'Gasolina 98', price: 1.859 },
        { type: 'Diesel', price: 1.509 },
        { type: 'GPL', price: 1.589 },
        { type: 'Elétrico', price: 0.5 }
      ],
    },
  ];

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
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        setAllStations(mockStations);
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
          timeInterval: 2000, // Update every 2 seconds
          distanceInterval: 10, // Update if moved 10 meters
        },
        (newLocation) => {
          setLocation(newLocation);
        }
      );
    } catch (error) {
      console.error('Location error:', error);
      setErrorMsg('Could not fetch location');
      setAllStations(mockStations);
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

  // Fetch and filter stations
  const fetchAndFilterStations = async () => {
    if (!location) return;

    try {
      const nearbyStations = await fetchNearbyStations(
        location.coords.latitude,
        location.coords.longitude,
        selectedFuelType
      ) as Station[];
      console.log('Fetched stations:', nearbyStations);
      setAllStations(nearbyStations);
    } catch (apiError) {
      console.log('API error, using mock data', apiError);
      console.log('Mock stations:', mockStations);
      setAllStations(mockStations);
    }
  };

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
      const isWithin = isWithinRadius(
        station.latitude,
        station.longitude,
        location.coords.latitude,
        location.coords.longitude,
        searchRadius
      );
      console.log(`Station ${station.id} (${station.name}):`, {
        lat: station.latitude,
        lng: station.longitude,
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

  // Fetch stations when fuel type changes or location updates
  useEffect(() => {
    if (location) {
      fetchAndFilterStations();
    }
  }, [selectedFuelType, location]);

  // Handle fuel type selection
  const handleFuelTypeChange = (fuelType: string) => {
    setSelectedFuelType(fuelType);
    setLoading(true);
  };

  // Handle marker press
  const handleMarkerPress = (station: Station | null) => {
    setSelectedStation(station);
    if (station) {
      // Find the index of the station in the sorted list
      const stationIndex = filteredStations.findIndex(s => s.id === station.id);
      console.log('Station index in list:', stationIndex);
      
      if (stationIndex !== -1) {
        // Scroll to the station
        console.log('Scrolling to station at index:', stationIndex);
        scrollViewRef.current?.scrollTo({
          y: stationIndex * 120, // Approximate height of each station card
          animated: true
        });
      }
    }
  };

  // Sort stations by price
  const sortedStations = [...filteredStations].sort((a, b) => {
    const aPrice = a.fuels.find(fuel => fuel.type === selectedFuelType)?.price || 0;
    const bPrice = b.fuels.find(fuel => fuel.type === selectedFuelType)?.price || 0;
    return aPrice - bPrice;
  });

  // Just get the top 5 stations
  const topStations = sortedStations.slice(0, 5);

  const handleNavigate = (station: Station) => {
    console.log(`Navigate to station: ${station.id}`);
    setSelectedStation(null);
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
  if (loading) {
    return (
      <View className={`flex-1 items-center justify-center`}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text className="mt-4 text-lg font-medium text-center text-slate-700 dark:text-slate-200">
          A localizar postos próximos...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView className={`flex-1 bg-slate-100 dark:bg-slate-900`}>
      <StatusBar style={darkMode ? "light" : "dark"} />

      {/* Header */}
      <Header />

      {/* Fuel Type Selector */}
      <FuelTypeSelector 
        selectedFuelType={selectedFuelType} 
        onSelectFuelType={handleFuelTypeChange} 
      />
      
      {/* Main Content Container with flexbox layout */}
      <View className="flex-1">
        {/* Map - Fixed height */}
        {location && (
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
              userLocation={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }}
              selectedFuelType={selectedFuelType}
              onMarkerPress={handleMarkerPress}
              searchRadius={searchRadius}
            />
            
            <TouchableOpacity
              className="absolute bottom-4 right-4 bg-white dark:bg-slate-800 rounded-full p-3 shadow-md"
              onPress={() => setBottomSheetVisible(true)}
            >
              <Ionicons name="list" size={24} color="#2563eb" />
            </TouchableOpacity>
          </Animated.View>
        )}
        
        {/* Stations List with ScrollView - Takes remaining height */}
        <View className="flex-1 bg-slate-100 dark:bg-slate-900">
          <View className="p-4">
            <Text className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              Postos mais baratos próximos:
            </Text>
          </View>
          
          <ScrollView 
            ref={scrollViewRef}
            className="flex-1 px-4" 
            onScroll={handleScroll} 
            scrollEventThrottle={16}
          >
            {filteredStations.length > 0 ? (
              filteredStations.map((station) => (
                <Animated.View
                  key={station.id}
                  style={styles.stationCardContainer}
                >
                  <StationCard
                    station={station}
                    selectedFuelType={selectedFuelType}
                    userLocation={location?.coords}
                    isSelected={selectedStation?.id === station.id}
                  />
                </Animated.View>
              ))
            ) : (
              <View className="items-center justify-center py-10">
                <Text className="text-slate-600 dark:text-slate-400">
                  Não foram encontrados postos próximos.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  stationCardContainer: {
    borderRadius: 8,
    overflow: 'hidden',
  },
});