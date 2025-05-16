import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useEffect, useState } from 'react';

// Definindo os tipos para o contexto
type NavigationAppType = 'google_maps' | 'waze' | 'apple_maps';

interface AppContextType {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  preferredNavigationApp: NavigationAppType;
  setPreferredNavigationApp: (app: NavigationAppType) => void;
  searchRadius: number;
  setSearchRadius: (radius: number) => void;
}

// Valores padrão para o contexto
const defaultValues: AppContextType = {
  darkMode: false,
  setDarkMode: () => {},
  preferredNavigationApp: 'google_maps',
  setPreferredNavigationApp: () => {},
  searchRadius: 5,
  setSearchRadius: () => {},
};

// Criação do contexto
export const AppContext = createContext<AppContextType>(defaultValues);

// Props do Provider
interface AppProviderProps {
  children: ReactNode;
}

// Provider do contexto
export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [darkMode, setDarkMode] = useState<boolean>(defaultValues.darkMode);
  const [preferredNavigationApp, setPreferredNavigationApp] = useState<NavigationAppType>(
    defaultValues.preferredNavigationApp
  );
  const [searchRadius, setSearchRadius] = useState<number>(defaultValues.searchRadius);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Função para atualizar o modo escuro e salvar
  const updateDarkMode = async (value: boolean) => {
    setDarkMode(value);
    try {
      await AsyncStorage.setItem('darkMode', String(value));
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

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [
          savedDarkMode,
          savedNavigationApp,
          savedRadius
        ] = await Promise.all([
          AsyncStorage.getItem('darkMode'),
          AsyncStorage.getItem('preferredNavigationApp'),
          AsyncStorage.getItem('searchRadius')
        ]);

        if (savedDarkMode !== null) {
          setDarkMode(savedDarkMode === 'true');
        }
        if (savedNavigationApp !== null) {
          setPreferredNavigationApp(savedNavigationApp as NavigationAppType);
        }
        if (savedRadius !== null) {
          setSearchRadius(parseInt(savedRadius, 10));
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

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
      }}
    >
      {children}
    </AppContext.Provider>
  );
};