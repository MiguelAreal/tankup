import { useContext } from 'react';
import { useColorScheme } from 'react-native';
import { AppContext } from '../context/AppContext';

/**
 * Hook personalizado para usar o tema da aplicação
 * Combina o modo escuro do sistema com a preferência do usuário
 */
export function useAppTheme() {
  const { darkMode } = useContext(AppContext);
  const systemTheme = useColorScheme();
  
  // Retorna o tema baseado na preferência do usuário ou no tema do sistema
  return {
    isDarkMode: darkMode,
    theme: darkMode ? 'dark' : 'light',
    systemTheme,
    colors: {
      background: darkMode ? '#1e293b' : '#f1f5f9', // slate-900 / slate-100
      text: darkMode ? '#e2e8f0' : '#1e293b', // slate-200 / slate-900
      // Adicione outras cores conforme necessário
    }
  };
}

/**
 * Hook para gerenciar as funcionalidades de navegação da aplicação
 */
export function useNavigation() {
  const { preferredNavigationApp } = useContext(AppContext);
  
  return {
    preferredApp: preferredNavigationApp,
    // Adicione aqui funções para abrir navegação
  };
}

/**
 * Hook para gerenciar configurações de pesquisa
 */
export function useSearchSettings() {
  const { searchRadius } = useContext(AppContext);
  
  return {
    radius: searchRadius,
    // Adicione aqui funções relacionadas à pesquisa
  };
}