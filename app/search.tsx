import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Strings } from '../types/strings';
import fuelTypesData from './assets/fuelTypes.json';
import locationsData from './assets/locations.json';
import stringsEN from './assets/strings.en.json';
import stringsPT from './assets/strings.pt.json';
import { useAppContext } from './context/AppContext';
import { useSearch } from './context/SearchContext';
import { fetchStationsByLocation } from './utils/api';

type District = {
  id: string;
  name: string;
  cities: string[];
};

type Screen = 'districts' | 'cities';

export default function SearchScreen() {
  const router = useRouter();
  const { language, selectedFuelTypes } = useAppContext();
  const { setSearchState } = useSearch();
  const strings = (language === 'en' ? stringsEN : stringsPT) as Strings;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedFuelType, setSelectedFuelType] = useState(selectedFuelTypes[0] || '');
  const [selectedSort, setSelectedSort] = useState<'mais_caro' | 'mais_barato'>('mais_barato');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFuelTypeModal, setShowFuelTypeModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [filteredDistricts, setFilteredDistricts] = useState<District[]>(locationsData.districts);
  const [currentScreen, setCurrentScreen] = useState<Screen>('districts');
  const [filteredCities, setFilteredCities] = useState<{ district: District; city: string }[]>([]);

  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (currentScreen === 'districts') {
        // Search in both districts and cities
        const districtMatches = locationsData.districts.filter(district => 
          district.name.toLowerCase().includes(query)
        );
        
        const cityMatches = locationsData.districts.flatMap(district => 
          district.cities
            .filter(city => city.toLowerCase().includes(query))
            .map(city => ({
              district,
              city
            }))
        );

        setFilteredDistricts(districtMatches);
        setFilteredCities(cityMatches);
      } else if (selectedDistrict) {
        const filtered = selectedDistrict.cities
          .filter(city => city.toLowerCase().includes(query))
          .map(city => ({
            district: selectedDistrict,
            city
          }));
        setFilteredCities(filtered);
      }
    } else {
      if (currentScreen === 'districts') {
        setFilteredDistricts(locationsData.districts);
        setFilteredCities([]);
      } else if (selectedDistrict) {
        setFilteredCities(selectedDistrict.cities.map(city => ({
          district: selectedDistrict,
          city
        })));
      }
    }
  }, [searchQuery, currentScreen, selectedDistrict]);

  const handleDistrictSelect = (district: District) => {
    setSelectedDistrict(district);
    setFilteredCities(district.cities.map(city => ({
      district,
      city: city
    })));
    setCurrentScreen('cities');
    setSearchQuery('');
  };

  const handleCitySelect = (cityData: { district: District; city: string }) => {
    setSelectedDistrict(cityData.district);
    setSelectedCity(cityData.city);
    setCurrentScreen('cities');
  };

  const handleBackPress = () => {
    if (currentScreen === 'cities') {
      setCurrentScreen('districts');
      setSelectedDistrict(null);
      setSearchQuery('');
    } else {
      router.replace('/');
    }
  };

  const handleFuelTypeSelect = (type: string) => {
    setSelectedFuelType(type);
    setShowFuelTypeModal(false);
  };

  const handleSortSelect = (sort: 'mais_caro' | 'mais_barato') => {
    setSelectedSort(sort);
    setShowSortModal(false);
  };

  const handleSearch = async () => {
    if (!selectedFuelType) {
      setError(language === 'en' ? 'Please select a fuel type' : 'Por favor, selecione um tipo de combustível');
      return;
    }

    if (!selectedDistrict && !selectedCity) {
      setError(language === 'en' ? 'Please select a district or city' : 'Por favor, selecione um distrito ou cidade');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const results = await fetchStationsByLocation({
        distrito: selectedDistrict?.name,
        municipio: selectedCity || undefined,
        fuelType: selectedFuelType,
        sortBy: selectedSort
      });
      
      // Store search results in memory using AppContext
      setSearchState({
        results,
        searchType: 'location',
        distrito: selectedDistrict?.name,
        municipio: selectedCity || undefined,
        fuelType: selectedFuelType,
        sortBy: selectedSort
      });
      
      router.replace('/');
    } catch (err) {
      setError(language === 'en' ? 'Error searching for stations' : 'Erro ao pesquisar postos');
    } finally {
      setIsLoading(false);
    }
  };

  const renderFuelTypeModal = () => (
    <Modal
      visible={showFuelTypeModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowFuelTypeModal(false)}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white dark:bg-slate-800 rounded-t-xl p-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-slate-800 dark:text-slate-200">
              {strings.search.fuelType}
            </Text>
            <TouchableOpacity onPress={() => setShowFuelTypeModal(false)}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
          <ScrollView className="max-h-96">
            {fuelTypesData.types
              .filter(type => selectedFuelTypes.includes(type.id))
              .map((type) => (
                <TouchableOpacity
                  key={type.id}
                  className={`p-4 border-b border-slate-200 dark:border-slate-700 ${
                    selectedFuelType === type.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                  onPress={() => handleFuelTypeSelect(type.id)}
                >
                  <View className="flex-row items-center">
                    <Ionicons
                      name={type.icon as any}
                      size={24}
                      color={selectedFuelType === type.id ? '#2563eb' : '#64748b'}
                    />
                    <Text className={`ml-3 text-lg ${
                      selectedFuelType === type.id
                        ? 'text-blue-600 dark:text-blue-400 font-medium'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}>
                      {strings.station.fuelType[type.id as keyof typeof strings.station.fuelType]}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderSortModal = () => (
    <Modal
      visible={showSortModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowSortModal(false)}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white dark:bg-slate-800 rounded-t-xl p-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-slate-800 dark:text-slate-200">
              {strings.search.sortBy}
            </Text>
            <TouchableOpacity onPress={() => setShowSortModal(false)}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
          <View>
            <TouchableOpacity
              className={`p-4 border-b border-slate-200 dark:border-slate-700 ${
                selectedSort === 'mais_barato' ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
              onPress={() => handleSortSelect('mais_barato')}
            >
              <View className="flex-row items-center">
                <Ionicons
                  name="trending-down"
                  size={24}
                  color={selectedSort === 'mais_barato' ? '#2563eb' : '#64748b'}
                />
                <Text className={`ml-3 text-lg ${
                  selectedSort === 'mais_barato'
                    ? 'text-blue-600 dark:text-blue-400 font-medium'
                    : 'text-slate-700 dark:text-slate-300'
                }`}>
                  {strings.station.sortBy.mais_barato}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              className={`p-4 ${
                selectedSort === 'mais_caro' ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
              onPress={() => handleSortSelect('mais_caro')}
            >
              <View className="flex-row items-center">
                <Ionicons
                  name="trending-up"
                  size={24}
                  color={selectedSort === 'mais_caro' ? '#2563eb' : '#64748b'}
                />
                <Text className={`ml-3 text-lg ${
                  selectedSort === 'mais_caro'
                    ? 'text-blue-600 dark:text-blue-400 font-medium'
                    : 'text-slate-700 dark:text-slate-300'
                }`}>
                  {strings.station.sortBy.mais_caro}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-100 dark:bg-slate-900">
      {/* Header */}
      <View className="px-4 py-2 flex-row items-center justify-between">
        <TouchableOpacity 
          onPress={handleBackPress}
          className="flex-row items-center"
        >
          <Ionicons name="arrow-back" size={24} color="#2563eb" />
          <Text className="ml-2 text-xl font-semibold text-blue-600 dark:text-blue-400">
            {currentScreen === 'districts' ? strings.search.district : selectedDistrict?.name}
          </Text>
        </TouchableOpacity>

        <View className="flex-row">
          <TouchableOpacity
            onPress={() => setShowFuelTypeModal(true)}
            className="mr-2 bg-white dark:bg-slate-800 px-3 py-2 rounded-lg flex-row items-center"
          >
            <Ionicons
              name={selectedFuelType ? "checkmark-circle" : "options"}
              size={20}
              color={selectedFuelType ? "#2563eb" : "#64748b"}
            />
            <Text className={`ml-2 ${
              selectedFuelType
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-slate-700 dark:text-slate-300'
            }`}>
              {selectedFuelType
                ? strings.station.fuelType[selectedFuelType as keyof typeof strings.station.fuelType]
                : strings.search.fuelType}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowSortModal(true)}
            className="bg-white dark:bg-slate-800 px-3 py-2 rounded-lg flex-row items-center"
          >
            <Ionicons
              name={selectedSort === 'mais_barato' ? 'trending-down' : 'trending-up'}
              size={20}
              color="#64748b"
            />
            <Text className="ml-2 text-slate-700 dark:text-slate-300">
              {strings.station.sortBy[selectedSort]}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View className="px-4 py-3">
        <TextInput
          className="bg-white dark:bg-slate-800 p-4 rounded-lg text-slate-800 dark:text-slate-200 text-base"
          placeholder={currentScreen === 'districts' ? strings.search.placeholder : strings.search.municipality}
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* List */}
      <ScrollView className="flex-1 px-4">
        {currentScreen === 'districts' ? (
          <>
            {/* Show matching cities first if there's a search query */}
            {searchQuery && filteredCities.length > 0 && (
              <View className="mb-6">
                <Text className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  {strings.search.municipality}
                </Text>
                {filteredCities.map((cityData) => (
                  <TouchableOpacity
                    key={`${cityData.district.id}-${cityData.city}`}
                    className="p-4 mb-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm"
                    onPress={() => handleCitySelect(cityData)}
                  >
                    <Text className="text-lg text-slate-800 dark:text-slate-200 font-medium">
                      {cityData.city}
                    </Text>
                    <Text className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {cityData.district.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Show districts */}
            <View>
              <Text className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-3">
                {strings.search.district}
              </Text>
              {filteredDistricts.map((district) => (
                <TouchableOpacity
                  key={district.id}
                  className="p-4 mb-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm"
                  onPress={() => handleDistrictSelect(district)}
                >
                  <Text className="text-lg text-slate-800 dark:text-slate-200 font-medium">
                    {district.name}
                  </Text>
                  <Text className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {district.cities.length} {strings.search.municipality.toLowerCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          // Cities List
          filteredCities.map((cityData) => (
            <TouchableOpacity
              key={`${cityData.district.id}-${cityData.city}`}
              className={`p-4 mb-3 rounded-lg shadow-sm ${
                selectedCity === cityData.city
                  ? 'bg-blue-600'
                  : 'bg-white dark:bg-slate-800'
              }`}
              onPress={() => setSelectedCity(cityData.city)}
            >
              <Text className={`text-lg font-medium ${
                selectedCity === cityData.city
                  ? 'text-white'
                  : 'text-slate-800 dark:text-slate-200'
              }`}>
                {cityData.city}
              </Text>
              <Text className={`text-sm mt-1 ${
                selectedCity === cityData.city
                  ? 'text-blue-100'
                  : 'text-slate-500 dark:text-slate-400'
              }`}>
                {cityData.district.name}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Search Button */}
      {currentScreen === 'cities' && (
        <View className="p-4">
          <TouchableOpacity
            className={`p-4 rounded-lg shadow-sm ${
              selectedFuelType ? 'bg-blue-600' : 'bg-slate-400'
            }`}
            onPress={() => handleSearch()}
            disabled={isLoading || !selectedFuelType}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white text-center font-medium text-lg">
                {strings.search.search}
              </Text>
            )}
          </TouchableOpacity>

          {error && (
            <Text className="text-red-500 mt-4 text-center">
              {error}
            </Text>
          )}
        </View>
      )}

      {renderFuelTypeModal()}
      {renderSortModal()}
    </SafeAreaView>
  );
}