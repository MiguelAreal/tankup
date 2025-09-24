import { Stack } from "expo-router";
import React, { useEffect } from "react";
import { StatusBar, View } from "react-native";
import "./app.css";
import { AppProvider, useAppContext } from "./context/AppContext";
import { SearchProvider } from "./context/SearchContext";
import './i18n';

// Configure router to ignore type files
export const unstable_settings = {
  initialRouteName: 'index',
  // Exclude type files from being treated as routes
  ignoreRoutes: [
    'types/**/*',
    'utils/**/*',
  ],
};

// Theme wrapper component
const ThemeWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { darkMode, theme } = useAppContext();

  useEffect(() => {
    // Update document class for web
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', darkMode);
      // Also update the body background color
      document.body.style.backgroundColor = theme.background;
      document.body.style.color = theme.text;
    }
  }, [darkMode, theme]);

  return (
    <View style={{ 
      flex: 1, 
      backgroundColor: theme.background
    }}>
      <StatusBar
        barStyle={darkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />
      {children}
    </View>
  );
};

export default function Layout() {
  return (
    <AppProvider>
      <SearchProvider>
        <ThemeWrapper>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
              contentStyle: {
                backgroundColor: 'transparent'
              }
            }}
          >
            <Stack.Screen 
              name="index" 
              options={{ 
                title: 'Tankup',
                headerShown: false,
              }} 
            />
            <Stack.Screen 
              name="search" 
              options={{ 
                title: 'Pesquisar por Localização',
                animation: 'slide_from_right',
              }} 
            />
            <Stack.Screen 
              name="favorites" 
              options={{ 
                title: 'Favoritos',
                animation: 'slide_from_right',
              }} 
            />
            <Stack.Screen 
              name="settings" 
              options={{ 
                title: 'Definições',
                animation: 'slide_from_right',
              }} 
            />
          </Stack>
        </ThemeWrapper>
      </SearchProvider>
    </AppProvider>
  );
}