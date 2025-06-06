import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import fuelTypesData from '../app/assets/fuelTypes.json';
import i18n from '../app/i18n';
import { Posto } from '../types/models';

// Theme configuration
const lightTheme = {
  background: '#f1f5f9', // slate-100
  card: '#ffffff',
  text: '#1e293b', // slate-900
  textSecondary: '#64748b', // slate-500
  border: '#e2e8f0', // slate-200
  primary: '#2563eb', // blue-600
  primaryLight: '#dbeafe', // blue-100
  accent: '#3b82f6', // blue-500
};

const darkTheme = {
  background: '#0f172a', // slate-900
  card: '#1e293b', // slate-800
  text: '#f1f5f9', // slate-100
  textSecondary: '#94a3b8', // slate-400
  border: '#334155', // slate-700
  primary: '#3b82f6', // blue-500
  primaryLight: '#1e3a8a', // blue-900
  accent: '#60a5fa', // blue-400
};

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
  theme: typeof lightTheme;
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
  adUnitId: string;
}

// Valores padrão para o contexto
const defaultValues: AppContextType = {
  darkMode: false,
  setDarkMode: () => {},
  theme: lightTheme,
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
  adUnitId: __DEV__ ? 'ca-app-pub-3940256099942544/6300978111' : 'ca-app-pub-2077617628178689/9692584772',
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
  const [theme, setTheme] = useState(darkMode ? darkTheme : lightTheme);
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

  // Add new effect to handle search state changes
  useEffect(() => {
    if (searchState === null) {
      // When search is cleared, ensure we clean up any persisted search state
      AsyncStorage.removeItem('searchState').catch(() => {
        // Silent error handling
      });
    } else {
      // When search state changes, persist it
      AsyncStorage.setItem('searchState', JSON.stringify(searchState)).catch(() => {
        // Silent error handling
      });
    }
  }, [searchState]);

  // Add search state to initial loading
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [
          darkMode,
          preferredNavigationApp,
          searchRadius,
          mapProvider,
          language,
          selectedFuelTypes,
          savedSearchState
        ] = await Promise.all([
          AsyncStorage.getItem('darkMode'),
          AsyncStorage.getItem('preferredNavigationApp'),
          AsyncStorage.getItem('searchRadius'),
          AsyncStorage.getItem('mapProvider'),
          AsyncStorage.getItem('language'),
          AsyncStorage.getItem('selectedFuelTypes'),
          AsyncStorage.getItem('searchState')
        ]);

        if (darkMode !== null) setDarkModeState(darkMode === 'true');
        if (preferredNavigationApp) {
          try {
            const parsedApp = JSON.parse(preferredNavigationApp);
            setPreferredNavigationAppState(parsedApp as NavigationAppType);
          } catch {
            setPreferredNavigationAppState(preferredNavigationApp as NavigationAppType);
          }
        }
        if (searchRadius) setSearchRadiusState(Number(searchRadius));
        if (mapProvider) setMapProviderState(mapProvider as MapProviderType);
        if (language) setLanguageState(language as LanguageType);
        if (selectedFuelTypes) setSelectedFuelTypesState(JSON.parse(selectedFuelTypes));
        if (savedSearchState) {
          try {
            const parsedSearchState = JSON.parse(savedSearchState);
            setSearchState(parsedSearchState);
          } catch {
            // If parsing fails, clear the search state
            AsyncStorage.removeItem('searchState');
          }
        }
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
    const checkSystemTheme = async () => {
      const savedDarkMode = await AsyncStorage.getItem('darkMode');
      if (savedDarkMode === null) {
        // If no saved preference, use system theme
        setDarkModeState(systemColorScheme === 'dark');
      }
    };
    checkSystemTheme();
  }, [systemColorScheme]);

  // Add a new effect to handle system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      const checkSystemTheme = async () => {
        const savedDarkMode = await AsyncStorage.getItem('darkMode');
        if (savedDarkMode === null) {
          // If no saved preference, use system theme
          setDarkModeState(colorScheme === 'dark');
        }
      };
      checkSystemTheme();
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Update theme when darkMode changes
  useEffect(() => {
    setTheme(darkMode ? darkTheme : lightTheme);
  }, [darkMode]);

  // Update darkMode when system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      const checkSystemTheme = async () => {
        const savedDarkMode = await AsyncStorage.getItem('darkMode');
        if (savedDarkMode === null) {
          setDarkModeState(colorScheme === 'dark');
        }
      };
      checkSystemTheme();
    });

    return () => {
      subscription.remove();
    };
  }, []);

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
        theme,
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
        clearSearch,
        adUnitId: defaultValues.adUnitId
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