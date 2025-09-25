import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import fuelTypesData from '../assets/fuelTypes.json';
import { changeLanguage } from '../i18n';
import { Theme } from '../types/theme';
import { fetchInfo, InfoResponse } from '../utils/api';

const DEFAULT_FUEL_TYPES = fuelTypesData.defaultTypes as string[];

const LEGACY_FUEL_TYPE_MAP: Record<string, string> = {
  gasoleo: 'Gasóleo simples',
  gasoleo_especial: 'Gasóleo especial',
  gasolina95: 'Gasolina simples 95',
  gasolina98: 'Gasolina 98',
  gpl: 'GPL Auto',
  biodiesel: 'Biodiesel B15',
};

type MapProviderType = 'openstreetmap' | 'cartodb_light' | 'cartodb_dark';

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
  mapProvider: MapProviderType;
  setMapProvider: (provider: MapProviderType) => Promise<void>;
  adUnitId: string;
  availableFuelTypes: string[];
  availableSorts: Array<'mais_barato' | 'mais_caro' | 'mais_perto' | 'mais_longe'>;
  availableBrands: string[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();

  const [darkMode, setDarkModeState] = useState(systemColorScheme === 'dark');
  const [language, setLanguageState] = useState<'en' | 'pt'>('pt');
  const [searchRadius, setSearchRadiusState] = useState(5);
  const [selectedFuelTypes, setSelectedFuelTypesState] = useState<string[]>(DEFAULT_FUEL_TYPES);
  const [preferredNavigationApp, setPreferredNavigationAppState] = useState<'google_maps' | 'waze' | 'apple_maps'>('google_maps');
  const [mapProvider, setMapProviderState] = useState<MapProviderType>('openstreetmap');
  const [isLoaded, setIsLoaded] = useState(false);
  const [availableFuelTypes, setAvailableFuelTypes] = useState<string[]>([]);
  const [availableSorts, setAvailableSorts] = useState<Array<'mais_barato' | 'mais_caro' | 'mais_perto' | 'mais_longe'>>(['mais_barato','mais_caro','mais_perto','mais_longe']);
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);

  // Load settings from AsyncStorage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [
          storedDarkMode,
          storedLanguage,
          storedSearchRadius,
          storedFuelTypes,
          storedNavigationApp,
          storedMapProvider
        ] = await Promise.all([
          AsyncStorage.getItem('darkMode'),
          AsyncStorage.getItem('language'),
          AsyncStorage.getItem('searchRadius'),
          AsyncStorage.getItem('selectedFuelTypes'),
          AsyncStorage.getItem('preferredNavigationApp'),
          AsyncStorage.getItem('mapProvider')
        ]);

        if (storedDarkMode !== null) setDarkModeState(storedDarkMode === 'true');
        if (storedLanguage !== null) {
          setLanguageState(storedLanguage as 'en' | 'pt');
          await changeLanguage(storedLanguage as 'en' | 'pt');
        }
        if (storedSearchRadius) setSearchRadiusState(Number(storedSearchRadius));
        if (storedFuelTypes) {
          try {
            const parsed: string[] = JSON.parse(storedFuelTypes);
            const normalized = parsed.map((t) => LEGACY_FUEL_TYPE_MAP[t] || t);
            setSelectedFuelTypesState(normalized);
          } catch {
            setSelectedFuelTypesState(DEFAULT_FUEL_TYPES);
          }
        }
        if (storedNavigationApp) {
          try {
            const parsed = JSON.parse(storedNavigationApp);
            setPreferredNavigationAppState(parsed as 'google_maps' | 'waze' | 'apple_maps');
          } catch {
            setPreferredNavigationAppState(storedNavigationApp as 'google_maps' | 'waze' | 'apple_maps');
          }
        }
        if (storedMapProvider) setMapProviderState(storedMapProvider as MapProviderType);
        // Fetch dynamic info (fuel types, brands, filters)
        try {
          const info: InfoResponse = await fetchInfo();
          setAvailableFuelTypes(info.combustiveis || []);
          setAvailableSorts((info.filtros || ['mais_barato','mais_caro','mais_perto','mais_longe']) as any);
          setAvailableBrands(info.marcas || []);
        } catch (e) {
          // Keep defaults on error
          setAvailableFuelTypes(fuelTypesData.types.map((t:any)=>t.id));
        }
      } catch (err) {
        console.error('Error loading settings:', err);
      } finally {
        setIsLoaded(true);
      }
    };

    loadSettings();
  }, []);


  // Persist setters
  const setDarkMode = useCallback(async (value: boolean) => {
    try {
      await AsyncStorage.setItem('darkMode', value.toString());
      setDarkModeState(value);
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', value);
        document.body.style.backgroundColor = value ? '#0f172a' : '#f1f5f9';
      }
    } catch (err) {
      console.error('Error saving dark mode:', err);
    }
  }, []);

  const setLanguage = useCallback(async (value: 'en' | 'pt') => {
    try {
      await AsyncStorage.setItem('language', value);
      setLanguageState(value);
      await changeLanguage(value);
    } catch (err) {
      console.error('Error saving language:', err);
    }
  }, []);

  const setSearchRadius = useCallback(async (value: number) => {
    try {
      await AsyncStorage.setItem('searchRadius', value.toString());
      setSearchRadiusState(value);
    } catch (err) {
      console.error('Error saving search radius:', err);
    }
  }, []);

  const setSelectedFuelTypes = useCallback(async (value: string[]) => {
    try {
      await AsyncStorage.setItem('selectedFuelTypes', JSON.stringify(value));
      setSelectedFuelTypesState(value);
    } catch (err) {
      console.error('Error saving fuel types:', err);
    }
  }, []);

  const setPreferredNavigationApp = useCallback(async (value: 'google_maps' | 'waze' | 'apple_maps') => {
    try {
      console.log('Saving nav app to AsyncStorage:', value);
      await AsyncStorage.setItem('preferredNavigationApp', value);
      setPreferredNavigationAppState(value);
    } catch (err) {
      console.error('Error saving navigation app:', err);
    }
  }, []);

  const setMapProvider = useCallback(async (value: MapProviderType) => {
    try {
      await AsyncStorage.setItem('mapProvider', value);
      setMapProviderState(value);
    } catch (err) {
      console.error('Error saving map provider:', err);
    }
  }, []);

  const theme = useMemo(() => ({
    background: darkMode ? '#0f172a' : '#f1f5f9',
    card: darkMode ? '#1e293b' : '#ffffff',
    text: darkMode ? '#f1f5f9' : '#1e293b',
    textSecondary: darkMode ? '#94a3b8' : '#64748b',
    primary: '#3b82f6',
    primaryLight: darkMode ? '#1e3a8a' : '#dbeafe',
    border: darkMode ? '#334155' : '#e2e8f0',
    header: darkMode ? '#1e293b' : '#ffffff',
    modal: darkMode ? '#1e293b' : '#ffffff',
    modalOverlay: 'rgba(0,0,0,0.5)',
    success: darkMode ? '#22c55e' : '#16a34a',
    error: darkMode ? '#ef4444' : '#dc2626',
    warning: darkMode ? '#f59e0b' : '#d97706',
  }), [darkMode]);


  const adUnitId = (__DEV__ ? 'ca-app-pub-3940256099942544/6300978111' : 'ca-app-pub-2077617628178689/9692584772');

  return (
    <AppContext.Provider
      value={{
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
        mapProvider,
        setMapProvider,
        theme,
        adUnitId
        ,availableFuelTypes
        ,availableSorts
        ,availableBrands
      }}
    >
    {isLoaded ? children : null}
    </AppContext.Provider>
  );
};
