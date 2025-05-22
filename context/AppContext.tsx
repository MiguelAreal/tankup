import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import fuelTypesData from '../app/assets/fuelTypes.json';

// Definindo os tipos para o contexto
type NavigationAppType = 'google_maps' | 'waze' | 'apple_maps';
type MapProviderType = 'openstreetmap' | 'cartodb' | 'stamen' | 'esri';
type LanguageType = 'pt' | 'en';

// Default selected fuel types from JSON
const DEFAULT_SELECTED_FUEL_TYPES = fuelTypesData.defaultTypes;

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
  const [darkMode, setDarkMode] = useState<boolean>(systemColorScheme === 'dark');
  const [preferredNavigationApp, setPreferredNavigationApp] = useState<NavigationAppType>(
    defaultValues.preferredNavigationApp
  );
  const [searchRadius, setSearchRadius] = useState<number>(defaultValues.searchRadius);
  const [mapProvider, setMapProvider] = useState<MapProviderType>(defaultValues.mapProvider);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [language, setLanguageState] = useState<LanguageType>('pt');
  const [selectedFuelTypes, setSelectedFuelTypes] = useState<string[]>(DEFAULT_SELECTED_FUEL_TYPES);

  // Função para atualizar o modo escuro e salvar
  const updateDarkMode = async (value: boolean) => {
    try {
      await AsyncStorage.setItem('darkMode', String(value));
      setDarkMode(value);
    } catch (error) {
      console.error('Erro ao salvar modo escuro:', error);
    }
  };

  // Função para atualizar o app de navegação e salvar
  const updateNavigationApp = async (app: NavigationAppType) => {
    setPreferredNavigationApp(app);
    try {
      await AsyncStorage.setItem('preferredNavigationApp', app);
    } catch (error) {
      console.error('Erro ao salvar app de navegação:', error);
    }
  };

  // Função para atualizar o raio de pesquisa e salvar
  const updateSearchRadius = async (radius: number) => {
    setSearchRadius(radius);
    try {
      await AsyncStorage.setItem('searchRadius', String(radius));
    } catch (error) {
      console.error('Erro ao salvar raio de pesquisa:', error);
    }
  };

  // Função para atualizar o provider do mapa e salvar
  const updateMapProvider = async (provider: MapProviderType) => {
    setMapProvider(provider);
    try {
      await AsyncStorage.setItem('mapProvider', provider);
    } catch (error) {
      console.error('Erro ao salvar provider do mapa:', error);
    }
  };

  const updateLanguage = async (lang: LanguageType) => {
    setLanguageState(lang);
    try {
      await AsyncStorage.setItem('language', lang);
    } catch (error) {
      console.error('Erro ao salvar idioma:', error);
    }
  };

  // Função para atualizar os tipos de combustível selecionados e salvar
  const updateSelectedFuelTypes = async (types: string[]) => {
    if (types.length > 6) {
      console.warn('Cannot select more than 6 fuel types');
      return;
    }
    setSelectedFuelTypes(types);
    try {
      await AsyncStorage.setItem('selectedFuelTypes', JSON.stringify(types));
    } catch (error) {
      console.error('Erro ao salvar tipos de combustível:', error);
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

  // Carrega as configurações iniciais
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [
          savedDarkMode,
          savedNavigationApp,
          savedRadius,
          savedMapProvider,
          savedLanguage,
          savedFuelTypes
        ] = await Promise.all([
          AsyncStorage.getItem('darkMode'),
          AsyncStorage.getItem('preferredNavigationApp'),
          AsyncStorage.getItem('searchRadius'),
          AsyncStorage.getItem('mapProvider'),
          AsyncStorage.getItem('language'),
          AsyncStorage.getItem('selectedFuelTypes')
        ]);

        // Atualiza o modo escuro primeiro
        if (savedDarkMode !== null) {
          setDarkMode(savedDarkMode === 'true');
        }
        
        if (savedNavigationApp !== null) {
          setPreferredNavigationApp(savedNavigationApp as NavigationAppType);
        }
        if (savedRadius !== null) {
          setSearchRadius(parseInt(savedRadius, 10));
        }
        if (savedMapProvider !== null) {
          setMapProvider(savedMapProvider as MapProviderType);
        }
        if (savedLanguage !== null) {
          setLanguageState(savedLanguage as LanguageType);
        }
        if (savedFuelTypes !== null) {
          setSelectedFuelTypes(JSON.parse(savedFuelTypes));
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
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
      setDarkMode(systemColorScheme === 'dark');
    }
  }, [systemColorScheme]);

  // Salva as configurações quando alteradas
  useEffect(() => {
    const saveSettings = async () => {
      try {
        await Promise.all([
          AsyncStorage.setItem('darkMode', JSON.stringify(darkMode)),
          AsyncStorage.setItem('preferredNavigationApp', JSON.stringify(preferredNavigationApp)),
          AsyncStorage.setItem('searchRadius', JSON.stringify(searchRadius)),
          AsyncStorage.setItem('mapProvider', JSON.stringify(mapProvider)),
          AsyncStorage.setItem('language', JSON.stringify(language)),
          AsyncStorage.setItem('selectedFuelTypes', JSON.stringify(selectedFuelTypes))
        ]);
      } catch (error) {
        console.error('Error saving settings:', error);
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
        setDarkMode: updateDarkMode,
        preferredNavigationApp,
        setPreferredNavigationApp: updateNavigationApp,
        searchRadius,
        setSearchRadius: updateSearchRadius,
        mapProvider,
        setMapProvider: updateMapProvider,
        isLoading,
        language,
        setLanguage: updateLanguage,
        selectedFuelTypes,
        setSelectedFuelTypes: updateSelectedFuelTypes,
        handleFuelTypeToggle,
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