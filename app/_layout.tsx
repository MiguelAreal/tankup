import { Stack } from "expo-router";
import "leaflet/dist/leaflet.css";
import React from "react";
import { AppProvider } from "../context/AppContext";
import "../global.css";
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
      <Stack
        screenOptions={{
          headerShown: false,
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
    </AppProvider>
  );
}