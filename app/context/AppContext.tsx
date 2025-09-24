import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { changeLanguage } from '../i18n';
import { Theme } from '../types/theme';

// Default fuel types
const DEFAULT_FUEL_TYPES = [
  'gasoleo',
  'gasolina95',
  'gasolina98',
  'gpl',
  'biodiesel',
  'gasoleo_especial'
];

interface AppContextType {
  darkMode: boolean;
  setDarkMode: (darkMode: boolean) => Promise<void>;
  language: 'en' | 'pt';
  setLanguage: (language: 'en' | 'pt') => Promise<void>;
  searchRadius: number;
  setSearchRadius: (radius: number) => Promise<void>;
  selectedFuelTypes: string[];
  setSelectedFuelTypes: (types: string[]) => Promise<void>;
  preferredNavigationApp: 'google_maps' | 'waze' | 'apple_maps';
  setPreferredNavigationApp: (app: 'google_maps' | 'waze' | 'apple_maps') => Promise<void>;
  theme: Theme;
  forceUpdate: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [darkMode, setDarkModeState] = useState(systemColorScheme === 'dark');
  const [language, setLanguageState] = useState<'en' | 'pt'>('pt');
  const [searchRadius, setSearchRadiusState] = useState(5);
  const [selectedFuelTypes, setSelectedFuelTypesState] = useState<string[]>(['gasoleo']);
  const [preferredNavigationApp, setPreferredNavigationAppState] = useState<'google_maps' | 'waze' | 'apple_maps'>('google_maps');
  const [updateTrigger, setUpdateTrigger] = useState(0);

  // Memoize the theme object to prevent unnecessary re-renders
  const theme = useMemo(() => ({
    background: darkMode ? '#0f172a' : '#f1f5f9', // slate-900 / slate-100
    card: darkMode ? '#1e293b' : '#ffffff', // slate-800 / white
    text: darkMode ? '#f1f5f9' : '#1e293b', // slate-100 / slate-900
    textSecondary: darkMode ? '#94a3b8' : '#64748b', // slate-400 / slate-500
    primary: '#3b82f6', // blue-500
    primaryLight: darkMode ? '#1e3a8a' : '#dbeafe', // blue-900 / blue-100
    border: darkMode ? '#334155' : '#e2e8f0', // slate-700 / slate-200
    header: darkMode ? '#1e293b' : '#ffffff', // slate-800 / white
    modal: darkMode ? '#1e293b' : '#ffffff', // slate-800 / white
    modalOverlay: 'rgba(0, 0, 0, 0.5)',
    success: darkMode ? '#22c55e' : '#16a34a', // green-500 / green-600
    error: darkMode ? '#ef4444' : '#dc2626', // red-500 / red-600
    warning: darkMode ? '#f59e0b' : '#d97706', // amber-500 / amber-600
  }), [darkMode]);

  const forceUpdate = useCallback(() => {
    setUpdateTrigger(prev => prev + 1);
  }, []);

  // Load saved settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedDarkMode = await AsyncStorage.getItem('darkMode');
        const savedLanguage = await AsyncStorage.getItem('language');
        const savedSearchRadius = await AsyncStorage.getItem('searchRadius');
        const savedFuelTypes = await AsyncStorage.getItem('selectedFuelTypes');
        const savedNavigationApp = await AsyncStorage.getItem('preferredNavigationApp');
        if (savedDarkMode !== null) {
          setDarkModeState(savedDarkMode === 'true');
        }
        if (savedLanguage !== null) {
          setLanguageState(savedLanguage as 'en' | 'pt');
          await changeLanguage(savedLanguage as 'en' | 'pt');
        }
        if (savedSearchRadius !== null) {
          setSearchRadiusState(Number(savedSearchRadius));
        }
        if (savedFuelTypes !== null) {
          setSelectedFuelTypesState(JSON.parse(savedFuelTypes));
        }
        if (savedNavigationApp !== null) {
          setPreferredNavigationAppState(savedNavigationApp as 'google_maps' | 'waze' | 'apple_maps');
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    loadSettings();
  }, []);

  const setDarkMode = useCallback(async (value: boolean) => {
    try {
      await AsyncStorage.setItem('darkMode', value.toString());
      setDarkModeState(value);
      // Force update the theme
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', value);
        document.body.style.backgroundColor = value ? '#1a1a1a' : '#ffffff';
      }
      forceUpdate();
    } catch (error) {
      console.error('Error saving dark mode:', error);
    }
  }, [forceUpdate]);

  const setLanguage = useCallback(async (value: 'en' | 'pt') => {
    try {
      await AsyncStorage.setItem('language', value);
      setLanguageState(value);
      await changeLanguage(value);
      forceUpdate();
    } catch (error) {
      console.error('Error saving language:', error);
    }
  }, [forceUpdate]);

  const setSearchRadius = useCallback(async (value: number) => {
    try {
      await AsyncStorage.setItem('searchRadius', value.toString());
      setSearchRadiusState(value);
      forceUpdate();
    } catch (error) {
      console.error('Error saving search radius:', error);
    }
  }, [forceUpdate]);

  const setSelectedFuelTypes = useCallback(async (value: string[]) => {
    try {
      await AsyncStorage.setItem('selectedFuelTypes', JSON.stringify(value));
      setSelectedFuelTypesState(value);
      forceUpdate();
    } catch (error) {
      console.error('Error saving fuel types:', error);
    }
  }, [forceUpdate]);

  const setPreferredNavigationApp = useCallback(async (value: 'google_maps' | 'waze' | 'apple_maps') => {
    try {
      await AsyncStorage.setItem('preferredNavigationApp', value);
      setPreferredNavigationAppState(value);
      forceUpdate();
    } catch (error) {
      console.error('Error saving navigation app:', error);
    }
  }, [forceUpdate]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    darkMode,
    setDarkMode,
    language,
    setLanguage,
    searchRadius,
    setSearchRadius,
    selectedFuelTypes,
    setSelectedFuelTypes,
    preferredNavigationApp,
    setPreferredNavigationApp,
    theme,
    forceUpdate,
  }), [
    darkMode,
    setDarkMode,
    language,
    setLanguage,
    searchRadius,
    setSearchRadius,
    selectedFuelTypes,
    setSelectedFuelTypes,
    preferredNavigationApp,
    setPreferredNavigationApp,
    theme,
    forceUpdate
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};