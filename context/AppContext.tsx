import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import fuelTypesData from '../app/assets/fuelTypes.json';
import i18n from '../app/i18n';
import { Posto } from '../types/models';

// Definindo os tipos para o contexto
type NavigationAppType = 'google_maps' | 'waze' | 'apple_maps';
type MapProviderType = 'openstreetmap' | 'cartodb_light' | 'cartodb_dark';
type LanguageType = 'pt' | 'en';

// Default selected fuel types from JSON
const DEFAULT_SELECTED_FUEL_TYPES = fuelTypesData.defaultTypes;

type SearchState = {
  results: Posto[];
  searchType: 'location';
  distrito?: string;
  municipio?: string;
  fuelType: string;
  sortBy: 'mais_caro' | 'mais_barato';
} | null;

interface AppContextType {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  preferredNavigationApp: NavigationAppType;
  setPreferredNavigationApp: (app: NavigationAppType) => void;
  searchRadius: number;
  setSearchRadius: (radius: number) => void;
  mapProvider: MapProviderType;
  setMapProvider: (provider: MapProviderType) => void;
  isLoading: boolean;
  language: LanguageType;
  setLanguage: (lang: LanguageType) => void;
  selectedFuelTypes: string[];
  setSelectedFuelTypes: (types: string[]) => void;
  handleFuelTypeToggle: (fuelType: string) => void;
  searchState: SearchState;
  setSearchState: (state: SearchState) => void;
  clearSearch: () => void;
}

// Valores padrão para o contexto
const defaultValues: AppContextType = {
  darkMode: false,
  setDarkMode: () => {},
  preferredNavigationApp: 'google_maps',
  setPreferredNavigationApp: () => {},
  searchRadius: 5,
  setSearchRadius: () => {},
  mapProvider: 'openstreetmap',
  setMapProvider: () => {},
  isLoading: true,
  language: 'pt',
  setLanguage: () => {},
  selectedFuelTypes: DEFAULT_SELECTED_FUEL_TYPES,
  setSelectedFuelTypes: () => {},
  handleFuelTypeToggle: () => {},
  searchState: null,
  setSearchState: () => {},
  clearSearch: () => {},
};

// Criação do contexto
const AppContext = createContext<AppContextType>(defaultValues);

// Props do Provider
interface AppProviderProps {
  children: ReactNode;
}

// Provider do contexto
export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [darkMode, setDarkModeState] = useState<boolean>(systemColorScheme === 'dark');
  const [preferredNavigationApp, setPreferredNavigationAppState] = useState<NavigationAppType>(
    defaultValues.preferredNavigationApp
  );
  const [searchRadius, setSearchRadiusState] = useState<number>(defaultValues.searchRadius);
  const [mapProvider, setMapProviderState] = useState<MapProviderType>(defaultValues.mapProvider);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [language, setLanguageState] = useState<LanguageType>('pt');
  const [selectedFuelTypes, setSelectedFuelTypesState] = useState<string[]>(DEFAULT_SELECTED_FUEL_TYPES);
  const [searchState, setSearchState] = useState<SearchState>(null);

  // Função para atualizar o modo escuro e salvar
  const setDarkMode = async (value: boolean) => {
    try {
      await AsyncStorage.setItem('darkMode', String(value));
      setDarkModeState(value);
    } catch (error) {
      // Silent error handling
    }
  };

  // Função para atualizar o app de navegação e salvar
  const setPreferredNavigationApp = async (value: 'google_maps' | 'waze' | 'apple_maps') => {
    try {
      await AsyncStorage.setItem('preferredNavigationApp', JSON.stringify(value));
      setPreferredNavigationAppState(value);
    } catch (error) {
      // Silent error handling
    }
  };

  // Função para atualizar o raio de pesquisa e salvar
  const setSearchRadius = async (value: number) => {
    try {
      await AsyncStorage.setItem('searchRadius', String(value));
      setSearchRadiusState(value);
    } catch (error) {
      // Silent error handling
    }
  };

  // Função para atualizar o provider do mapa e salvar
  const setMapProvider = async (value: 'openstreetmap' | 'cartodb_light' | 'cartodb_dark') => {
    try {
      await AsyncStorage.setItem('mapProvider', value);
      setMapProviderState(value);
    } catch (error) {
      // Silent error handling
    }
  };

  const setLanguage = async (value: 'en' | 'pt') => {
    try {
      await AsyncStorage.setItem('language', value);
      setLanguageState(value);
      i18n.changeLanguage(value);
    } catch (error) {
      // Silent error handling
    }
  };

  // Função para atualizar os tipos de combustível selecionados e salvar
  const setSelectedFuelTypes = async (types: string[]) => {
    if (types.length > 6) {
      return;
    }
    try {
      await AsyncStorage.setItem('selectedFuelTypes', JSON.stringify(types));
      setSelectedFuelTypesState(types);
    } catch (error) {
      // Silent error handling
    }
  };

  const handleFuelTypeToggle = (fuelType: string) => {
    const isSelected = selectedFuelTypes.includes(fuelType);
    if (isSelected) {
      // Only allow removal if there's more than one type selected
      if (selectedFuelTypes.length > 1) {
        setSelectedFuelTypes(selectedFuelTypes.filter(type => type !== fuelType));
      }
    } else {
      // Allow adding if we haven't reached the maximum
      if (selectedFuelTypes.length < 6) {
        setSelectedFuelTypes([...selectedFuelTypes, fuelType]);
      }
    }
  };

  const clearSearch = () => {
    setSearchState(null);
  };

  // Carrega as configurações iniciais
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [
          darkMode,
          preferredNavigationApp,
          searchRadius,
          mapProvider,
          language,
          selectedFuelTypes
        ] = await Promise.all([
          AsyncStorage.getItem('darkMode'),
          AsyncStorage.getItem('preferredNavigationApp'),
          AsyncStorage.getItem('searchRadius'),
          AsyncStorage.getItem('mapProvider'),
          AsyncStorage.getItem('language'),
          AsyncStorage.getItem('selectedFuelTypes')
        ]);

        if (darkMode !== null) setDarkModeState(darkMode === 'true');
        if (preferredNavigationApp) {
          try {
            const parsedApp = JSON.parse(preferredNavigationApp);
            setPreferredNavigationAppState(parsedApp as NavigationAppType);
          } catch {
            // If parsing fails, use the value directly
            setPreferredNavigationAppState(preferredNavigationApp as NavigationAppType);
          }
        }
        if (searchRadius) setSearchRadiusState(Number(searchRadius));
        if (mapProvider) setMapProviderState(mapProvider as MapProviderType);
        if (language) setLanguageState(language as LanguageType);
        if (selectedFuelTypes) setSelectedFuelTypesState(JSON.parse(selectedFuelTypes));
      } catch (error) {
        // Silent error handling
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Atualiza o modo escuro quando o tema do sistema muda
  useEffect(() => {
    const savedDarkMode = AsyncStorage.getItem('darkMode');
    if (savedDarkMode === null) {
      setDarkModeState(systemColorScheme === 'dark');
    }
  }, [systemColorScheme]);

  // Salva as configurações quando alteradas
  useEffect(() => {
    const saveSettings = async () => {
      try {
        await Promise.all([
          AsyncStorage.setItem('darkMode', String(darkMode)),
          AsyncStorage.setItem('preferredNavigationApp', JSON.stringify(preferredNavigationApp)),
          AsyncStorage.setItem('searchRadius', String(searchRadius)),
          AsyncStorage.setItem('mapProvider', mapProvider),
          AsyncStorage.setItem('language', language),
          AsyncStorage.setItem('selectedFuelTypes', JSON.stringify(selectedFuelTypes))
        ]);
      } catch (error) {
        // Silent error handling
      }
    };

    if (!isLoading) {
      saveSettings();
    }
  }, [darkMode, preferredNavigationApp, searchRadius, mapProvider, language, selectedFuelTypes, isLoading]);

  // Não renderiza nada até as configurações serem carregadas
  if (isLoading) {
    return null;
  }

  return (
    <AppContext.Provider
      value={{
        darkMode,
        setDarkMode,
        preferredNavigationApp,
        setPreferredNavigationApp,
        searchRadius,
        setSearchRadius,
        mapProvider,
        setMapProvider,
        isLoading,
        language,
        setLanguage,
        selectedFuelTypes,
        setSelectedFuelTypes,
        handleFuelTypeToggle,
        searchState,
        setSearchState,
        clearSearch
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};