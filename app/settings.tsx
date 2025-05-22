import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Platform, SafeAreaView, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useAppContext } from '../context/AppContext';
import fuelTypesData from './assets/fuelTypes.json';
import stringsEN from './assets/strings.en.json';
import stringsPT from './assets/strings.pt.json';
import { Strings } from './types/strings';

// Map provider options
const mapProviders = [
  { id: 'openstreetmap', name: 'OpenStreetMap' },
  { id: 'cartodb', name: 'CartoDB Light' },
  { id: 'stamen', name: 'Stamen Terrain' },
  { id: 'esri', name: 'ESRI World Imagery' },
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
  const strings = (language === 'en' ? stringsEN : stringsPT) as Strings;

  // Sincroniza as configurações locais com o contexto
  useEffect(() => {
    if (!contextLoading) {
      setIsLoading(false);
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
    console.log('Toggling dark mode to:', value);
    setDarkMode(value);
  };

  const handleNavigationAppChange = (app: 'google_maps' | 'waze' | 'apple_maps') => {
    setPreferredNavigationApp(app);
  };

  const handleRadiusChange = (radius: number) => {
    setSearchRadius(radius);
  };

  const handleMapProviderChange = (provider: 'openstreetmap' | 'cartodb' | 'stamen' | 'esri') => {
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
          <View className="bg-white dark:bg-slate-800 rounded-lg p-4 mb-4">
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
          <View className="bg-white dark:bg-slate-800 rounded-lg p-4 mb-4">
            <View className="flex-row items-center mb-2">
              <Ionicons name="navigate" size={24} color="#2563eb" />
              <Text className="ml-3 text-lg text-slate-800 dark:text-slate-200">
                {strings.settings.navigationApp}
              </Text>
            </View>
            
            <TouchableOpacity 
              className={`flex-row items-center p-3 rounded-lg mb-2 ${
                preferredNavigationApp === 'google_maps' 
                  ? 'bg-blue-100 dark:bg-blue-900' 
                  : 'bg-transparent'
              }`}
              onPress={() => handleNavigationAppChange('google_maps')}
              testID="googleMapsButton"
            >
              <Ionicons 
                name="navigate" 
                size={24} 
                color={preferredNavigationApp === 'google_maps' ? '#2563eb' : '#9ca3af'} 
              />
              <Text 
                className={`ml-3 ${
                  preferredNavigationApp === 'google_maps'
                    ? 'text-blue-600 dark:text-blue-400 font-medium'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Google Maps
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className={`flex-row items-center p-3 rounded-lg mb-2 ${
                preferredNavigationApp === 'waze' 
                  ? 'bg-blue-100 dark:bg-blue-900' 
                  : 'bg-transparent'
              }`}
              onPress={() => handleNavigationAppChange('waze')}
              testID="wazeButton"
            >
              <Ionicons 
                name="navigate" 
                size={24} 
                color={preferredNavigationApp === 'waze' ? '#2563eb' : '#9ca3af'} 
              />
              <Text 
                className={`ml-3 ${
                  preferredNavigationApp === 'waze'
                    ? 'text-blue-600 dark:text-blue-400 font-medium'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Waze
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className={`flex-row items-center p-3 rounded-lg ${
                preferredNavigationApp === 'apple_maps' 
                  ? 'bg-blue-100 dark:bg-blue-900'
                  : 'bg-transparent'
              }`}
              onPress={() => handleNavigationAppChange('apple_maps')}
              testID="appleMapsButton"
            >
              <Ionicons 
                name="navigate" 
                size={24} 
                color={preferredNavigationApp === 'apple_maps' ? '#2563eb' : '#9ca3af'} 
              />
              <Text 
                className={`ml-3 ${
                  preferredNavigationApp === 'apple_maps'
                    ? 'text-blue-600 dark:text-blue-400 font-medium'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Apple Maps
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Raio de Pesquisa */}
          <View className="bg-white dark:bg-slate-800 rounded-lg p-4 mb-4">
            <View className="flex-row items-center mb-2">
              <Ionicons name="location" size={24} color="#2563eb" />
              <Text className="ml-3 text-lg text-slate-800 dark:text-slate-200">
                {strings.settings.searchRadius}
              </Text>
            </View>
            
            <View className="flex-row justify-between mb-2">
              {[5, 10, 15, 20].map((radius) => (
                <TouchableOpacity
                  key={radius}
                  className={`py-4 px-8 rounded-lg ${
                    searchRadius === radius
                      ? 'bg-blue-600 dark:bg-blue-500'
                      : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                  onPress={() => handleRadiusChange(radius)}
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
          
          {/* Map Provider Selection - Only show on web */}
          {Platform.OS === 'web' && (
            <View className="bg-white dark:bg-slate-800 rounded-lg p-4 mb-4">
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
          <View className="bg-white dark:bg-slate-800 rounded-lg p-4 mb-4">
            <View className="flex-row items-center mb-2">
              <Ionicons name="language" size={24} color="#2563eb" />
              <Text className="ml-3 text-lg text-slate-800 dark:text-slate-200">
                {strings.settings.language}
              </Text>
            </View>
            <View className="flex-row">
              <TouchableOpacity
                className={`mr-2 px-4 py-2 rounded-lg ${language === 'pt' ? 'bg-blue-600' : 'bg-slate-200'} `}
                onPress={() => setLanguage('pt')}
              >
                <Text className={language === 'pt' ? 'text-white font-medium' : 'text-slate-700'}>Português</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`px-4 py-2 rounded-lg ${language === 'en' ? 'bg-blue-600' : 'bg-slate-200'} `}
                onPress={() => setLanguage('en')}
              >
                <Text className={language === 'en' ? 'text-white font-medium' : 'text-slate-700'}>English</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Fuel Type Selection */}
          <View className="bg-white dark:bg-slate-800 rounded-lg p-4 mb-4">
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
          <View className="bg-white dark:bg-slate-800 rounded-lg p-4">
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