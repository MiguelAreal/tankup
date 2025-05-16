import { Stack } from "expo-router";
import "leaflet/dist/leaflet.css";
import { AppProvider } from "../context/AppContext";
import "../global.css";

export default function Layout() {
  return (
    <AppProvider>
      <Stack
        screenOptions={{
           headerShown: false,
          contentStyle: {
            backgroundColor: 'transparent',
          },
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