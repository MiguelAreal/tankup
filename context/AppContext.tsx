import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

// Definindo os tipos para o contexto
type NavigationAppType = 'google_maps' | 'waze' | 'apple_maps';
type MapProviderType = 'openstreetmap' | 'cartodb' | 'stamen' | 'esri';
type LanguageType = 'pt' | 'en';

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
};

// Criação do contexto
export const AppContext = createContext<AppContextType>(defaultValues);

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

  // Carrega as configurações iniciais
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [
          savedDarkMode,
          savedNavigationApp,
          savedRadius,
          savedMapProvider,
          savedLanguage
        ] = await Promise.all([
          AsyncStorage.getItem('darkMode'),
          AsyncStorage.getItem('preferredNavigationApp'),
          AsyncStorage.getItem('searchRadius'),
          AsyncStorage.getItem('mapProvider'),
          AsyncStorage.getItem('language')
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
      }}
    >
      {children}
    </AppContext.Provider>
  );
};