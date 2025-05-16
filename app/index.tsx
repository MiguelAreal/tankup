import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { AppContext } from '../context/AppContext';
import BottomSheet from './components/BottomSheet';
import FuelTypeSelector from './components/FuelTypeSelector';
import Header from './components/Header';
import Map from './components/Map/Map';
import { Station } from './components/Map/Map.types';
import StationCard from './components/StationCard';
import { fetchNearbyStations } from './utils/api';

// Define types
export default function HomeScreen() {
  const mapHeight = useRef(new Animated.Value(0.60)).current; // altura inicial: 60%

  const { darkMode } = useContext(AppContext);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedFuelType, setSelectedFuelType] = useState('Diesel');
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);

  // Mock data for stations to use when API fails or for development
  const mockStations: Station[] = [
    {
      id: '1',
      name: 'Posto Galp - Areeiro',
      brand: 'Galp',
      address: 'Av. Almirante Gago Coutinho 64, Lisboa',
      distance: 0.8,
      latitude: 38.742772,
      longitude: -9.136848,
      fuels: [
        { type: 'Gasolina 95', price: 1.699 },
        { type: 'Gasolina 98', price: 1.849 },
        { type: 'Diesel', price: 1.499 },
        { type: 'GPL', price: 1.579 }
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
        { type: 'GPL', price: 1.569 }
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
        { type: 'GPL', price: 1.589 }
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
        { type: 'GPL', price: 1.589 }
      ],
    }, {
      id: '5',
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
        { type: 'GPL', price: 1.589 }
      ],
    },
  ];


  const animateMapHeight = (toValue: number) => {
  Animated.timing(mapHeight, {
    toValue,
    duration: 50,
    easing: Easing.linear,
    useNativeDriver: false, // altura não suporta native driver
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



  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        // Use mock data even when permission is denied
        setStations(mockStations);
        setLoading(false);
        return;
      }

      try {
        const location = await Location.getCurrentPositionAsync({});
        setLocation(location);
        
        // Try to fetch stations data from API
        try {
          const nearbyStations = await fetchNearbyStations(
            location.coords.latitude,
            location.coords.longitude,
            selectedFuelType
          ) as Station[];
          setStations(nearbyStations);
        } catch (apiError) {
          console.log('API error, using mock data', apiError);
          // Use mock data if API fails
          setStations(mockStations);
        }
      } catch (error) {
        console.error('Location error:', error);
        setErrorMsg('Could not fetch location');
        // Use mock data with default location
        setStations(mockStations);
        // Set default location to Lisbon
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
    })();
  }, [selectedFuelType]);

  // Handle fuel type selection
  const handleFuelTypeChange = (fuelType: string) => {
    setSelectedFuelType(fuelType);
    setLoading(true);
  };

  // Handle marker press
  const handleMarkerPress = (station: Station) => {
    setSelectedStation(station);
    setBottomSheetVisible(true);
  };

  // Sort stations by price
  const sortedStations = [...stations].sort((a, b) => {
    const aPrice = a.fuels.find(fuel => fuel.type === selectedFuelType)?.price || 0;
    const bPrice = b.fuels.find(fuel => fuel.type === selectedFuelType)?.price || 0;
    return aPrice - bPrice;
  });

  // Just get the top 5 stations
  const topStations = sortedStations.slice(0, 5);

  // Render loading screen
  if (loading) {
    return (
      <View className={`flex-1 items-center justify-center `}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text className="mt-4 text-lg font-medium text-center text-slate-700 dark:text-slate-200">
          A localizar postos próximos...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView className={`flex-1 `}>
      <StatusBar style="auto" />

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
                outputRange: ['40%', '60%'], // interpolação de percentagem
              }),
              width: '100%',
            }}
          >

            <Map
              stations={topStations}
              userLocation={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }}
              selectedFuelType={selectedFuelType}
              onMarkerPress={handleMarkerPress}
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
      <ScrollView className="flex-1" onScroll={handleScroll} scrollEventThrottle={16}>
          <View className="p-4 pt-6">
            <Text className="text-lg font-semibold mb-2 text-slate-800 dark:text-slate-200">
              Postos mais baratos próximos:
            </Text>
            
            {topStations.length > 0 ? (
              topStations.map((station) => (
                <StationCard
                  key={station.id}
                  station={station}
                  selectedFuelType={selectedFuelType}
                  userLocation={location?.coords}
                />
              ))
            ) : (
              <View className="items-center justify-center py-10">
                <Text className="text-slate-600 dark:text-slate-400">
                  Não foram encontrados postos próximos.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
      
      {/* Bottom Sheet for station details */}
      <BottomSheet
        visible={bottomSheetVisible}
        onClose={() => setBottomSheetVisible(false)}
        title={selectedStation?.name || "Detalhes do Posto"}
      >
        {selectedStation ? (
          <View className="p-4">
            <Text className="text-xl font-bold mb-2">{selectedStation.name}</Text>
            <Text className="text-gray-700 mb-1">Marca: {selectedStation.brand}</Text>
            <Text className="text-gray-700 mb-3">Endereço: {selectedStation.address}</Text>
            
            <Text className="text-lg font-semibold mt-2 mb-1">Preços dos Combustíveis:</Text>
            {selectedStation.fuels.map((fuel) => (
              <View 
                key={fuel.type} 
                className={`flex-row justify-between py-2 ${fuel.type === selectedFuelType ? 'bg-blue-50 p-2 rounded' : ''}`}
              >
                <Text className="font-medium">{fuel.type}</Text>
                <Text className={fuel.type === selectedFuelType ? 'font-bold text-blue-600' : ''}>
                  {fuel.price.toFixed(3)} €/L
                </Text>
              </View>
            ))}
            
            <TouchableOpacity 
              className="mt-6 bg-blue-600 rounded-lg py-3 items-center"
              onPress={() => {
                // Navigate to station detail page or open in maps app
                console.log(`Navigate to station: ${selectedStation.id}`);
                setBottomSheetVisible(false);
              }}
            >
              <Text className="text-white font-medium">Navegar até ao Posto</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="p-4 items-center">
            <Text>Selecione um posto no mapa</Text>
          </View>
        )}
      </BottomSheet>
    </SafeAreaView>
  );
}