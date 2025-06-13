import { Stack } from "expo-router";
import React from "react";
import "./app.css";
import { AppProvider } from "./context/AppContext";
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

export default function Layout() {
  return (
    <AppProvider>
      <SearchProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
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
      </SearchProvider>
    </AppProvider>
  );
}