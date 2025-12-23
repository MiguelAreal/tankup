import { SplashScreen, Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Linking, Platform, StatusBar, View } from "react-native";
import "./app.css";
import { AppBlockingScreen } from "./components/AppBlockingScreen";
import { AppProvider, useAppContext } from "./context/AppContext";
import { SearchProvider } from "./context/SearchContext";
import './i18n';
import { InfoService } from "./network/infoService"; // Verifica se o caminho está correto
import { compareVersions, getCurrentPlatform, getCurrentVersion } from "./utils/versionCheck";

export const unstable_settings = {
  initialRouteName: 'index',
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
        translucent={true}
      />
      {children}
    </View>
  );
};

SplashScreen.preventAutoHideAsync();

// --- COMPONENTE COM A LÓGICA DA APP ---
function RootLayoutNav() {
  const [isReady, setIsReady] = useState(false);
  const [blockingState, setBlockingState] = useState<{
    blocked: boolean;
    type: 'maintenance' | 'update' | null;
    message: string;
  }>({ blocked: false, type: null, message: '' });

  useEffect(() => {
    const checkAppVersion = async () => {
      try {
        const currentVer = getCurrentVersion();
        const platform = getCurrentPlatform();

        // Faz o request
        const configs = await InfoService.getSysVersions();
        
        // Encontra a config para a plataforma atual
        const config = configs.find(c => c.platform === platform);

        if (config) {
          // 1. Verifica Manutenção
          if (config.maintenanceMode) {
            setBlockingState({
              blocked: true,
              type: 'maintenance',
              message: config.maintenanceMessage
            });
            return; 
          }

          // 2. Verifica Force Update (Versão Atual < Min Version)
          if (compareVersions(currentVer, config.minVersion) === -1) {
            setBlockingState({
              blocked: true,
              type: 'update',
              message: config.maintenanceMessage || 'Esta atualização é obrigatória.'
            });
            return; 
          }

          // 3. Verifica Soft Update (Apenas Mobile)
          // Na web ignoramos soft updates para não incomodar, já que o refresh resolve
          if (Platform.OS !== 'web' && compareVersions(currentVer, config.latestVersion) === -1) {
             Alert.alert(
              "Atualização Disponível",
              "Uma nova versão com melhorias está disponível.",
              [
                { text: "Mais tarde", style: "cancel" },
                { text: "Atualizar", onPress: () => {
                    const url = Platform.OS === 'ios' 
                      ? 'https://apps.apple.com/...' // Coloca o URL real
                      : 'https://play.google.com/...'; // Coloca o URL real
                    Linking.openURL(url);
                }}
              ]
            );
          }
        }
      } catch (error) {
        console.error("Falha ao verificar versão:", error);
      } finally {
        setIsReady(true);
        await SplashScreen.hideAsync();
      }
    };

    checkAppVersion();
  }, []);

  // Se ainda estiver a carregar, retorna null
  if (!isReady) {
    return null;
  }

  // Se estiver bloqueado, mostra o ecrã de bloqueio (DENTRO do ThemeWrapper)
  if (blockingState.blocked && blockingState.type) {
    return (
      <ThemeWrapper>
        <AppBlockingScreen type={blockingState.type} message={blockingState.message} />
      </ThemeWrapper>
    );
  }

  // App Normal
  return (
    <ThemeWrapper>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: 'transparent' }
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Tankup', headerShown: false }} />
        <Stack.Screen name="search" options={{ title: 'Pesquisar por Localização', animation: 'slide_from_right' }} />
        <Stack.Screen name="favorites" options={{ title: 'Favoritos', animation: 'slide_from_right' }} />
        <Stack.Screen name="settings" options={{ title: 'Definições', animation: 'slide_from_right' }} />
      </Stack>
    </ThemeWrapper>
  );
}

export default function Layout() {
  return (
    <AppProvider>
      <SearchProvider>
        <RootLayoutNav />
      </SearchProvider>
    </AppProvider>
  );
}