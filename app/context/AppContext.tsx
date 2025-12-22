import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import fuelTypesData from '../assets/fuelTypes.json';
import i18n from '../i18n'; // <--- Importa a instância configurada do i18next
import { Theme } from '../interfaces/theme';
import { InfoService } from '../network/infoService'; // Certifica-te que este ficheiro existe
import { setItem } from '../utils/storage'; // Certifica-te que este utilitário existe

// --- Constants & Types ---
const DEFAULT_FUEL_TYPES = fuelTypesData.defaultTypes as string[];
const DEFAULT_RADIUS = 5;

const LEGACY_FUEL_TYPE_MAP: Record<string, string> = {
  gasoleo: 'Gasóleo simples',
  gasoleo_especial: 'Gasóleo especial',
  gasolina95: 'Gasolina simples 95',
  gasolina98: 'Gasolina 98',
  gpl: 'GPL Auto',
  biodiesel: 'Biodiesel B15',
};

// Keys para evitar erros de digitação ("Magic Strings")
const STORAGE_KEYS = {
  DARK_MODE: 'darkMode',
  LANGUAGE: 'language',
  RADIUS: 'searchRadius',
  FUEL_TYPES: 'selectedFuelTypes',
  NAV_APP: 'preferredNavigationApp',
  MAP_PROVIDER: 'mapProvider',
  EXCLUDED_BRANDS: 'excludedBrands'
} as const;

type MapProviderType = 'openstreetmap' | 'cartodb_light' | 'cartodb_dark';
type NavigationAppType = 'google_maps' | 'waze' | 'apple_maps';
type LanguageType = 'en' | 'pt';

interface AppContextType {
  // State
  darkMode: boolean;
  language: LanguageType;
  searchRadius: number;
  selectedFuelTypes: string[];
  preferredNavigationApp: NavigationAppType;
  theme: Theme;
  mapProvider: MapProviderType;
  excludedBrands: string[];
  adUnitId: string;

  
  // Dynamic Data
  availableFuelTypes: string[];
  availableBrands: string[];

  // Actions
  setDarkMode: (value: boolean) => Promise<void>;
  setLanguage: (value: LanguageType) => Promise<void>;
  setSearchRadius: (value: number) => Promise<void>;
  setSelectedFuelTypes: (value: string[]) => Promise<void>;
  setPreferredNavigationApp: (value: NavigationAppType) => Promise<void>;
  setMapProvider: (value: MapProviderType) => Promise<void>;
  toggleExcludedBrand: (brand: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();

  // --- States ---
  const [isLoaded, setIsLoaded] = useState(false);
  const [darkMode, setDarkModeState] = useState(systemColorScheme === 'dark');
  const [language, setLanguageState] = useState<LanguageType>('pt');
  const [searchRadius, setSearchRadiusState] = useState(DEFAULT_RADIUS);
  const [selectedFuelTypes, setSelectedFuelTypesState] = useState<string[]>(DEFAULT_FUEL_TYPES);
  const [preferredNavigationApp, setPreferredNavigationAppState] = useState<NavigationAppType>('google_maps');
  const [mapProvider, setMapProviderState] = useState<MapProviderType>('openstreetmap');
  const [excludedBrands, setExcludedBrandsState] = useState<string[]>([]);

  // Data States
  const [availableFuelTypes, setAvailableFuelTypes] = useState<string[]>([]);
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);

  // --- Initialization ---
  useEffect(() => {
    const loadSettingsAndData = async () => {
      try {
        // Dispara tudo em paralelo (Storage + API Request)
        const [
          storedDarkMode,
          storedLanguage,
          storedSearchRadius,
          storedFuelTypes,
          storedNavigationApp,
          storedMapProvider,
          storedExcludedBrands,
          apiInfo
        ] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.DARK_MODE),
          AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE),
          AsyncStorage.getItem(STORAGE_KEYS.RADIUS),
          AsyncStorage.getItem(STORAGE_KEYS.FUEL_TYPES),
          AsyncStorage.getItem(STORAGE_KEYS.NAV_APP),
          AsyncStorage.getItem(STORAGE_KEYS.MAP_PROVIDER),
          AsyncStorage.getItem(STORAGE_KEYS.EXCLUDED_BRANDS),
          // API Call segura (se falhar, retorna null mas não quebra o Promise.all)
          InfoService.getInfo().catch((err) => {
             console.warn('Failed to fetch info:', err);
             return null;
          })
        ]);

        // 2. Processa Settings
        if (storedDarkMode !== null) setDarkModeState(storedDarkMode === 'true');
        
        if (storedLanguage) {
          const lang = storedLanguage as LanguageType;
          setLanguageState(lang);
          await i18n.changeLanguage(lang); 
        }
        
        if (storedSearchRadius) setSearchRadiusState(Number(storedSearchRadius));
        
        if (storedFuelTypes) {
          try {
            const parsed: string[] = JSON.parse(storedFuelTypes);
            // Normaliza nomes antigos se necessário
            const normalized = parsed.map((t) => LEGACY_FUEL_TYPE_MAP[t] || t);
            setSelectedFuelTypesState(normalized);
          } catch {
            setSelectedFuelTypesState(DEFAULT_FUEL_TYPES);
          }
        }

        if (storedNavigationApp) {
             try {
                const app = storedNavigationApp.startsWith('"') 
                   ? JSON.parse(storedNavigationApp) 
                   : storedNavigationApp;
                setPreferredNavigationAppState(app as NavigationAppType);
             } catch (e) {
                console.warn('Error parsing nav app preference', e);
             }
        }

        if (storedMapProvider) setMapProviderState(storedMapProvider as MapProviderType);

        if (storedExcludedBrands) {
          try {
            setExcludedBrandsState(JSON.parse(storedExcludedBrands));
          } catch {
            setExcludedBrandsState([]);
          }
        }

        // 3. Processa Dados da API
        if (apiInfo) {
          setAvailableFuelTypes(apiInfo.combustiveis || []);
          setAvailableBrands(apiInfo.marcas || []);
        } else {
          // Fallback em caso de erro na API
          setAvailableFuelTypes(fuelTypesData.types.map((t: any) => t.id));
        }

      } catch (err) {
        console.error('CRITICAL: Error loading app settings', err);
      } finally {
        setIsLoaded(true);
      }
    };

    loadSettingsAndData();
  }, []);

  // --- Side Effect para Web (Dark Mode) ---
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', darkMode);
      document.body.style.backgroundColor = darkMode ? '#0f172a' : '#f1f5f9';
    }
  }, [darkMode]);

  // --- Actions (Memoized) ---  
  const setDarkMode = useCallback(async (value: boolean) => {
    setDarkModeState(value);
    await setItem(STORAGE_KEYS.DARK_MODE, value.toString());
  }, []);

  const setLanguage = useCallback(async (value: LanguageType) => {
    setLanguageState(value);
    await i18n.changeLanguage(value);
    await setItem(STORAGE_KEYS.LANGUAGE, value);
  }, []);

  const setSearchRadius = useCallback(async (value: number) => {
    setSearchRadiusState(value);
    await setItem(STORAGE_KEYS.RADIUS, value.toString());
  }, []);

  const setSelectedFuelTypes = useCallback(async (value: string[]) => {
    setSelectedFuelTypesState(value);
    await setItem(STORAGE_KEYS.FUEL_TYPES, JSON.stringify(value));
  }, []);

  const setPreferredNavigationApp = useCallback(async (value: NavigationAppType) => {
    setPreferredNavigationAppState(value);
    await setItem(STORAGE_KEYS.NAV_APP, value);
  }, []);

  const toggleExcludedBrand = useCallback(async (brand: string) => {
    setExcludedBrandsState((prev) => {
      const newExcluded = prev.includes(brand)
        ? prev.filter((b) => b !== brand)
        : [...prev, brand];
      
      // Persiste no storage
      setItem(STORAGE_KEYS.EXCLUDED_BRANDS, JSON.stringify(newExcluded));
      return newExcluded;
    });
  }, []);

  const setMapProvider = useCallback(async (value: MapProviderType) => {
    setMapProviderState(value);
    await setItem(STORAGE_KEYS.MAP_PROVIDER, value);
  }, []);

  // --- Theme ---
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

  // --- Context Value (Memoized to prevent re-renders) ---
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
    mapProvider,
    setMapProvider,
    excludedBrands,
    toggleExcludedBrand,
    theme,
    adUnitId,
    availableFuelTypes,
    availableBrands
  }), [
    darkMode, language, searchRadius, selectedFuelTypes, preferredNavigationApp, 
    mapProvider, theme, availableFuelTypes, availableBrands,
    setDarkMode, setLanguage, setSearchRadius, setSelectedFuelTypes, 
    setPreferredNavigationApp, setMapProvider,excludedBrands, toggleExcludedBrand
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {isLoaded ? children : null}
    </AppContext.Provider>
  );
};