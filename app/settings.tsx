import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Platform, SafeAreaView, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useAppContext } from '../context/AppContext';
import { Strings } from '../types/strings';
import fuelTypesData from './assets/fuelTypes.json';
import stringsEN from './assets/strings.en.json';
import stringsPT from './assets/strings.pt.json';

// Map provider options
const mapProviders = [
  { id: 'openstreetmap', name: 'OpenStreetMap Standard', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '© OpenStreetMap contributors' },
  { id: 'cartodb_light', name: 'CartoDB Positron (Light)', url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', attribution: '© OpenStreetMap, © CARTO' },
  { id: 'cartodb_dark', name: 'CartoDB Dark Matter', url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', attribution: '© OpenStreetMap, © CARTO' }
];

export default function SettingsScreen() {
  const router = useRouter();
  const { 
    darkMode, 
    setDarkMode, 
    preferredNavigationApp, 
    setPreferredNavigationApp, 
    searchRadius, 
    setSearchRadius,
    mapProvider,
    setMapProvider,
    isLoading: contextLoading,
    language,
    setLanguage,
    selectedFuelTypes,
    setSelectedFuelTypes
  } = useAppContext();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isMapDropdownOpen, setIsMapDropdownOpen] = useState(false);
  const [isNavDropdownOpen, setIsNavDropdownOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isRadiusDropdownOpen, setIsRadiusDropdownOpen] = useState(false);
  const strings = (language === 'en' ? stringsEN : stringsPT) as Strings;

  // Initialize dropdowns based on current values
  useEffect(() => {
    if (!contextLoading) {
      setIsLoading(false);
      // Open the dropdowns that match the current values
      setIsMapDropdownOpen(true);
      setIsNavDropdownOpen(true);
      setIsLangDropdownOpen(true);
      setIsRadiusDropdownOpen(true);
    }
  }, [contextLoading]);

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

  const handleDarkModeToggle = async (value: boolean) => {
    setDarkMode(value);
    try {
      await AsyncStorage.setItem('darkMode', String(value));
    } catch (error) {
      // Silent error handling
    }
  };

  const handleNavigationAppChange = (app: 'google_maps' | 'waze' | 'apple_maps') => {
    setPreferredNavigationApp(app);
  };

  const handleRadiusChange = (radius: number) => {
    setSearchRadius(radius);
  };

  const handleMapProviderChange = (provider: 'openstreetmap' | 'cartodb_light' | 'cartodb_dark') => {
    setMapProvider(provider);
    setIsMapDropdownOpen(false);
  };

  const getCurrentMapProviderName = () => {
    return mapProviders.find(p => p.id === mapProvider)?.name || 'OpenStreetMap';
  };
  
  const handleBackPress = () => {
    router.replace('/');
  };

  const handleFuelTypeToggle = (fuelType: string) => {
    const isSelected = selectedFuelTypes.includes(fuelType);
    if (isSelected) {
      if (selectedFuelTypes.length > 1) {
        setSelectedFuelTypes(selectedFuelTypes.filter(type => type !== fuelType));
      }
    } else {
      if (selectedFuelTypes.length < 6) {
        setSelectedFuelTypes([...selectedFuelTypes, fuelType]);
      }
    }
  };

  const getCurrentNavAppName = () => {
    switch (preferredNavigationApp) {
      case 'google_maps':
        return 'Google Maps';
      case 'waze':
        return 'Waze';
      case 'apple_maps':
        return 'Apple Maps';
      default:
        return 'Google Maps';
    }
  };

  const getCurrentLanguageName = () => {
    switch (language) {
      case 'pt':
        return 'Português';
      case 'en':
        return 'English';
      default:
        return 'Português';
    }
  };

  const getCurrentRadiusText = () => {
    return `${searchRadius} km`;
  };

  if (isLoading || contextLoading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-100 dark:bg-slate-900 justify-center items-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView className="flex-1 bg-slate-100 dark:bg-slate-900">
      <ScrollView className="flex-1">
        {/* Botão Voltar */}
        <View className="px-4 py-2">
          <TouchableOpacity 
            onPress={handleBackPress}
            className="flex-row items-center"
          >
            <Ionicons name="arrow-back" size={24} color="#2563eb" />
            <Text className="ml-2 text-xl font-semibold text-blue-600 dark:text-blue-400">
              {strings.settings.title}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View className="p-4">
          {/* Toggle de Modo Escuro */}
          <View className="bg-white dark:bg-slate-800 rounded-lg p-4 mb-6">
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center">
                <Ionicons name="moon" size={24} color="#2563eb" />
                <Text className="ml-3 text-lg text-slate-800 dark:text-slate-200">
                  {strings.settings.darkMode}
                </Text>
              </View>
              <Switch
                value={darkMode}
                onValueChange={handleDarkModeToggle}
                trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
                thumbColor={darkMode ? '#ffffff' : '#f3f4f6'}
                testID="darkModeSwitch"
              />
            </View>
          </View>
          
          {/* App de Navegação Preferido */}
          <View className="bg-white dark:bg-slate-800 rounded-lg p-4 mb-6">
            <TouchableOpacity 
              className="flex-row justify-between items-center"
              onPress={() => setIsNavDropdownOpen(!isNavDropdownOpen)}
            >
              <View className="flex-row items-center">
                <Ionicons name="navigate" size={20} color="#2563eb" />
                <Text className="ml-3 text-lg text-slate-800 dark:text-slate-200">
                  {strings.settings.navigationApp}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Text className="text-slate-600 dark:text-slate-400 mr-2">
                  {getCurrentNavAppName()}
                </Text>
                <Ionicons 
                  name={isNavDropdownOpen ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#94a3b8" 
                />
              </View>
            </TouchableOpacity>

            {isNavDropdownOpen && (
              <View className="mt-2 border-t border-slate-200 dark:border-slate-700">
                <TouchableOpacity 
                  className={`p-4 rounded-lg ${
                    preferredNavigationApp === 'google_maps' 
                      ? 'bg-blue-50 dark:bg-blue-900/30' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                  onPress={() => {
                    handleNavigationAppChange('google_maps');
                    setIsNavDropdownOpen(false);
                  }}
                >
                  <Text 
                    className={`${
                      preferredNavigationApp === 'google_maps'
                        ? 'text-blue-600 dark:text-blue-400 font-medium'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Google Maps
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  className={`p-4 rounded-lg ${
                    preferredNavigationApp === 'waze' 
                      ? 'bg-blue-50 dark:bg-blue-900/30' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                  onPress={() => {
                    handleNavigationAppChange('waze');
                    setIsNavDropdownOpen(false);
                  }}
                >
                  <Text 
                    className={`${
                      preferredNavigationApp === 'waze'
                        ? 'text-blue-600 dark:text-blue-400 font-medium'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Waze
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  className={`p-4 rounded-lg ${
                    preferredNavigationApp === 'apple_maps' 
                      ? 'bg-blue-50 dark:bg-blue-900/30' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                  onPress={() => {
                    handleNavigationAppChange('apple_maps');
                    setIsNavDropdownOpen(false);
                  }}
                >
                  <Text 
                    className={`${
                      preferredNavigationApp === 'apple_maps'
                        ? 'text-blue-600 dark:text-blue-400 font-medium'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Apple Maps
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          {/* Raio de Pesquisa */}
          <View className="bg-white dark:bg-slate-800 rounded-lg p-4 mb-6">
            <TouchableOpacity 
              className="flex-row justify-between items-center"
              onPress={() => setIsRadiusDropdownOpen(!isRadiusDropdownOpen)}
            >
              <View className="flex-row items-center">
                <Ionicons name="location" size={20} color="#2563eb" />
                <Text className="ml-3 text-lg text-slate-800 dark:text-slate-200">
                  {strings.settings.searchRadius}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Text className="text-slate-600 dark:text-slate-400 mr-2">
                  {getCurrentRadiusText()}
                </Text>
                <Ionicons 
                  name={isRadiusDropdownOpen ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#94a3b8" 
                />
              </View>
            </TouchableOpacity>

            {isRadiusDropdownOpen && (
              <View className="mt-2 border-t border-slate-200 dark:border-slate-700">
                <View className="flex-row justify-between mt-4">
                  {[5, 10, 15, 20].map((radius) => (
                    <TouchableOpacity
                      key={radius}
                      className={`py-4 px-8 rounded-lg ${
                        searchRadius === radius
                          ? 'bg-blue-600 dark:bg-blue-500'
                          : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                      onPress={() => {
                        handleRadiusChange(radius);
                        setIsRadiusDropdownOpen(false);
                      }}
                      testID={`radius${radius}Button`}
                    >
                      <Text
                        className={`${
                          searchRadius === radius
                            ? 'text-white font-medium'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {radius} km
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
          
          {/* Map Provider Selection - Only show on web */}
          {Platform.OS === 'web' && (
            <View className="bg-white dark:bg-slate-800 rounded-lg p-4 mb-6">
              <TouchableOpacity 
                className="flex-row justify-between items-center"
                onPress={() => setIsMapDropdownOpen(!isMapDropdownOpen)}
              >
                <View className="flex-row items-center">
                  <Ionicons name="map" size={20} color="#2563eb" />
                  <Text className="ml-3 text-lg text-slate-800 dark:text-slate-200">
                    Estilo do Mapa
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Text className="text-slate-600 dark:text-slate-400 mr-2">
                    {getCurrentMapProviderName()}
                  </Text>
                  <Ionicons 
                    name={isMapDropdownOpen ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color="#94a3b8" 
                  />
                </View>
              </TouchableOpacity>

              {isMapDropdownOpen && (
                <View className="mt-2 border-t border-slate-200 dark:border-slate-700">
                  {mapProviders.map((provider) => (
                    <TouchableOpacity 
                      key={provider.id}
                      className={`p-4 rounded-lg ${
                        mapProvider === provider.id 
                          ? 'bg-blue-50 dark:bg-blue-900/30' 
                          : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                      }`}
                      onPress={() => handleMapProviderChange(provider.id as any)}
                    >
                      <Text 
                        className={`${
                          mapProvider === provider.id
                            ? 'text-blue-600 dark:text-blue-400 font-medium'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {provider.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Idioma */}
          <View className="bg-white dark:bg-slate-800 rounded-lg p-4 mb-6">
            <TouchableOpacity 
              className="flex-row justify-between items-center"
              onPress={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
            >
              <View className="flex-row items-center">
                <Ionicons name="language" size={20} color="#2563eb" />
                <Text className="ml-3 text-lg text-slate-800 dark:text-slate-200">
                  {strings.settings.language}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Text className="text-slate-600 dark:text-slate-400 mr-2">
                  {getCurrentLanguageName()}
                </Text>
                <Ionicons 
                  name={isLangDropdownOpen ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#94a3b8" 
                />
              </View>
            </TouchableOpacity>

            {isLangDropdownOpen && (
              <View className="mt-2 border-t border-slate-200 dark:border-slate-700">
                <TouchableOpacity 
                  className={`p-4 rounded-lg ${
                    language === 'pt' 
                      ? 'bg-blue-50 dark:bg-blue-900/30' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                  onPress={() => {
                    setLanguage('pt');
                    setIsLangDropdownOpen(false);
                  }}
                >
                  <Text 
                    className={`${
                      language === 'pt'
                        ? 'text-blue-600 dark:text-blue-400 font-medium'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Português
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  className={`p-4 rounded-lg ${
                    language === 'en' 
                      ? 'bg-blue-50 dark:bg-blue-900/30' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                  onPress={() => {
                    setLanguage('en');
                    setIsLangDropdownOpen(false);
                  }}
                >
                  <Text 
                    className={`${
                      language === 'en'
                        ? 'text-blue-600 dark:text-blue-400 font-medium'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    English
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Fuel Type Selection */}
          <View className="bg-white dark:bg-slate-800 rounded-lg p-4 mb-6">
            <View className="flex-row items-center mb-2">
              <Ionicons name="water" size={24} color="#2563eb" />
              <Text className="ml-3 text-lg text-slate-800 dark:text-slate-200">
                {strings.settings.fuelType}
              </Text>
            </View>
            
            <Text className="text-slate-600 dark:text-slate-400 mb-4">
              {language === 'en' 
                ? 'Select up to 6 fuel types to display in the main screen'
                : 'Selecione até 6 tipos de combustível para exibir na tela principal'}
            </Text>

            <View className="flex-row flex-wrap">
              {fuelTypesData.types.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  className={`mr-2 mb-2 p-2 px-4 rounded-lg ${
                    selectedFuelTypes.includes(type.id)
                      ? 'bg-blue-600'
                      : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                  onPress={() => handleFuelTypeToggle(type.id)}
                >
                  <View className="flex-row items-center">
                    <Ionicons
                      name={type.icon as any}
                      size={20}
                      color={selectedFuelTypes.includes(type.id) ? '#ffffff' : '#64748b'}
                    />
                    <Text
                      className={`ml-2 ${
                        selectedFuelTypes.includes(type.id)
                          ? 'text-white font-medium'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {strings.station.fuelType[type.id as keyof typeof strings.station.fuelType]}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Sobre */}
          <View className="bg-white dark:bg-slate-800 rounded-lg p-4 mb-6">
            <View className="flex-row items-center mb-2">
              <Ionicons name="information-circle" size={24} color="#2563eb" />
              <Text className="ml-3 text-lg text-slate-800 dark:text-slate-200">
                {strings.settings.about}
              </Text>
            </View>
            
            <Text className="text-slate-600 dark:text-slate-400 mb-2">
              {strings.settings.aboutText}
            </Text>
            
            <Text className="text-slate-600 dark:text-slate-400 mb-2">
              {strings.settings.version}: 1.0.0
            </Text>

            <TouchableOpacity
              className="mt-2"
              onPress={() => Linking.openURL('https://github.com/MiguelAreal')}
            >
              <Text className="text-blue-600 dark:text-blue-400">
              {strings.settings.developer}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="mt-2"
              onPress={() => Linking.openURL('https://precoscombustiveis.dgeg.gov.pt')}
            >
              <Text className="text-blue-600 dark:text-blue-400">
              {strings.settings.provider}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}