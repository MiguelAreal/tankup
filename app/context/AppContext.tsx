import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

// Default fuel types
const DEFAULT_FUEL_TYPES = [
  'Gasóleo simples',
  'Gasolina simples 95',
  'Gasolina 98',
  'GPL Auto',
  'Biodiesel B15',
  'Gasóleo especial'
];

type AppContextType = {
  darkMode: boolean;
  setDarkMode: (darkMode: boolean) => Promise<void>;
  searchRadius: number;
  setSearchRadius: (radius: number) => Promise<void>;
  language: 'en' | 'pt';
  setLanguage: (language: 'en' | 'pt') => Promise<void>;
  selectedFuelTypes: string[];
  setSelectedFuelTypes: (types: string[]) => Promise<void>;
  preferredNavigationApp: 'google_maps' | 'waze' | 'apple_maps';
  setPreferredNavigationApp: (app: 'google_maps' | 'waze' | 'apple_maps') => Promise<void>;
  mapProvider: 'openstreetmap' | 'cartodb_light' | 'cartodb_dark';
  setMapProvider: (provider: 'openstreetmap' | 'cartodb_light' | 'cartodb_dark') => Promise<void>;
  theme: {
    background: string;
    text: string;
    textSecondary: string;
    primary: string;
    primaryLight: string;
    card: string;
    border: string;
    switchTrack: string;
    switchThumb: string;
  };
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [darkMode, setDarkModeState] = useState(systemColorScheme === 'dark');
  const [searchRadius, setSearchRadiusState] = useState(10);
  const [language, setLanguageState] = useState<'en' | 'pt'>('pt');
  const [selectedFuelTypes, setSelectedFuelTypesState] = useState<string[]>(DEFAULT_FUEL_TYPES);
  const [preferredNavigationApp, setPreferredNavigationAppState] = useState<'google_maps' | 'waze' | 'apple_maps'>('google_maps');
  const [mapProvider, setMapProviderState] = useState<'openstreetmap' | 'cartodb_light' | 'cartodb_dark'>('openstreetmap');

  // Load saved settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedDarkMode = await AsyncStorage.getItem('darkMode');
        const savedSearchRadius = await AsyncStorage.getItem('searchRadius');
        const savedLanguage = await AsyncStorage.getItem('language');
        const savedFuelTypes = await AsyncStorage.getItem('selectedFuelTypes');
        const savedNavApp = await AsyncStorage.getItem('preferredNavigationApp');
        const savedMapProvider = await AsyncStorage.getItem('mapProvider');

        if (savedDarkMode !== null) setDarkModeState(savedDarkMode === 'true');
        if (savedSearchRadius !== null) setSearchRadiusState(Number(savedSearchRadius));
        if (savedLanguage !== null) setLanguageState(savedLanguage as 'en' | 'pt');
        if (savedFuelTypes !== null) {
          const parsedTypes = JSON.parse(savedFuelTypes);
          // Ensure we have at least one fuel type selected
          if (parsedTypes.length > 0) {
            setSelectedFuelTypesState(parsedTypes);
          }
        }
        if (savedNavApp !== null) setPreferredNavigationAppState(savedNavApp as 'google_maps' | 'waze' | 'apple_maps');
        if (savedMapProvider !== null) setMapProviderState(savedMapProvider as 'openstreetmap' | 'cartodb_light' | 'cartodb_dark');
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    loadSettings();
  }, []);

  const setDarkMode = async (value: boolean) => {
    setDarkModeState(value);
    try {
      await AsyncStorage.setItem('darkMode', String(value));
    } catch (error) {
      console.error('Error saving dark mode:', error);
    }
  };

  const setSearchRadius = async (value: number) => {
    setSearchRadiusState(value);
    try {
      await AsyncStorage.setItem('searchRadius', String(value));
    } catch (error) {
      console.error('Error saving search radius:', error);
    }
  };

  const setLanguage = async (value: 'en' | 'pt') => {
    setLanguageState(value);
    try {
      await AsyncStorage.setItem('language', value);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const setSelectedFuelTypes = async (value: string[]) => {
    // Ensure we always have at least one fuel type selected
    if (value.length === 0) {
      value = [DEFAULT_FUEL_TYPES[0]];
    }
    setSelectedFuelTypesState(value);
    try {
      await AsyncStorage.setItem('selectedFuelTypes', JSON.stringify(value));
    } catch (error) {
      console.error('Error saving fuel types:', error);
    }
  };

  const setPreferredNavigationApp = async (value: 'google_maps' | 'waze' | 'apple_maps') => {
    setPreferredNavigationAppState(value);
    try {
      await AsyncStorage.setItem('preferredNavigationApp', value);
    } catch (error) {
      console.error('Error saving navigation app:', error);
    }
  };

  const setMapProvider = async (value: 'openstreetmap' | 'cartodb_light' | 'cartodb_dark') => {
    setMapProviderState(value);
    try {
      await AsyncStorage.setItem('mapProvider', value);
    } catch (error) {
      console.error('Error saving map provider:', error);
    }
  };

  const theme = {
    background: darkMode ? '#0f172a' : '#f8fafc',
    text: darkMode ? '#f1f5f9' : '#0f172a',
    textSecondary: darkMode ? '#94a3b8' : '#64748b',
    primary: '#2563eb',
    primaryLight: '#3b82f6',
    card: darkMode ? '#1e293b' : '#ffffff',
    border: darkMode ? '#334155' : '#e2e8f0',
    switchTrack: darkMode ? '#475569' : '#cbd5e1',
    switchThumb: darkMode ? '#f8fafc' : '#ffffff'
  };

  const value = {
    darkMode,
    setDarkMode,
    searchRadius,
    setSearchRadius,
    language,
    setLanguage,
    selectedFuelTypes,
    setSelectedFuelTypes,
    preferredNavigationApp,
    setPreferredNavigationApp,
    mapProvider,
    setMapProvider,
    theme
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};