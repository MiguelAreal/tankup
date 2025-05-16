import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, SafeAreaView, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { AppContext } from '../context/AppContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { 
    darkMode, 
    setDarkMode, 
    preferredNavigationApp, 
    setPreferredNavigationApp, 
    searchRadius, 
    setSearchRadius 
  } = useContext(AppContext);
  
  const [isLoading, setIsLoading] = useState(true);
  const [localSettings, setLocalSettings] = useState({
    darkMode,
    preferredNavigationApp,
    searchRadius
  });

  // Sincroniza as configurações locais com o contexto
  useEffect(() => {
    setLocalSettings({
      darkMode,
      preferredNavigationApp,
      searchRadius
    });
    setIsLoading(false);
  }, [darkMode, preferredNavigationApp, searchRadius]);

  const saveSettings = async (key: string, value: any) => {
    try {
      await AsyncStorage.setItem(key, String(value));
      console.log(`Configuração ${key} salva:`, value);
    } catch (error) {
      console.error(`Erro ao salvar ${key}:`, error);
    }
  };
  
  const handleDarkModeToggle = (value: boolean) => {
  setDarkMode(value); // Isso agora chama updateDarkMode do contexto
};

const handleNavigationAppChange = (app: 'google_maps' | 'waze' | 'apple_maps') => {
  setPreferredNavigationApp(app); // Isso agora chama updateNavigationApp
};

const handleRadiusChange = (radius: number) => {
  setSearchRadius(radius); // Isso agora chama updateSearchRadius
};
  
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-100 dark:bg-slate-900 justify-center items-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView className="flex-1 bg-slate-100 dark:bg-slate-900">
      <ScrollView className="flex-1">
        {/* Botão Voltar - modificado para navegar para a raiz */}
        <View className="px-4 py-2">
          <TouchableOpacity 
            onPress={() => router.push('/')} // Sempre navega para a raiz
            className="flex-row items-center"
          >
            <Ionicons name="arrow-back" size={24} color="#2563eb" />
            <Text className="ml-2 text-blue-600 dark:text-blue-400 font-medium">Voltar</Text>
          </TouchableOpacity>
        </View>
        
        <View className="p-4">
          {/* Toggle de Modo Escuro */}
          <View className="bg-white dark:bg-slate-800 rounded-lg p-4 mb-4">
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center">
                <Ionicons name="moon" size={24} color="#2563eb" />
                <Text className="ml-3 text-lg text-slate-800 dark:text-slate-200">
                  Modo Escuro
                </Text>
              </View>
              <Switch
                value={localSettings.darkMode} // Usa o estado local
                onValueChange={handleDarkModeToggle}
                trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
                thumbColor={localSettings.darkMode ? '#ffffff' : '#f3f4f6'}
                testID="darkModeSwitch"
              />
            </View>
          </View>
          
          {/* App de Navegação Preferido */}
          <View className="bg-white dark:bg-slate-800 rounded-lg p-4 mb-4">
            <Text className="text-lg text-slate-800 dark:text-slate-200 mb-2">
              App de Navegação Preferido
            </Text>
            
            <TouchableOpacity 
              className={`flex-row items-center p-3 rounded-lg mb-2 ${
                localSettings.preferredNavigationApp === 'google_maps' 
                  ? 'bg-blue-100 dark:bg-blue-900' 
                  : 'bg-transparent'
              }`}
              onPress={() => handleNavigationAppChange('google_maps')}
              testID="googleMapsButton"
            >
              <Ionicons 
                name="navigate" 
                size={24} 
                color={localSettings.preferredNavigationApp === 'google_maps' ? '#2563eb' : '#9ca3af'} 
              />
              <Text 
                className={`ml-3 ${
                  localSettings.preferredNavigationApp === 'google_maps'
                    ? 'text-blue-600 dark:text-blue-400 font-medium'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Google Maps
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className={`flex-row items-center p-3 rounded-lg mb-2 ${
                localSettings.preferredNavigationApp === 'waze' 
                  ? 'bg-blue-100 dark:bg-blue-900' 
                  : 'bg-transparent'
              }`}
              onPress={() => handleNavigationAppChange('waze')}
              testID="wazeButton"
            >
              <Ionicons 
                name="navigate" 
                size={24} 
                color={localSettings.preferredNavigationApp === 'waze' ? '#2563eb' : '#9ca3af'} 
              />
              <Text 
                className={`ml-3 ${
                  localSettings.preferredNavigationApp === 'waze'
                    ? 'text-blue-600 dark:text-blue-400 font-medium'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Waze
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className={`flex-row items-center p-3 rounded-lg ${
                localSettings.preferredNavigationApp === 'apple_maps' 
                  ? 'bg-blue-100 dark:bg-blue-900'
                  : 'bg-transparent'
              }`}
              onPress={() => handleNavigationAppChange('apple_maps')}
              testID="appleMapsButton"
            >
              <Ionicons 
                name="navigate" 
                size={24} 
                color={localSettings.preferredNavigationApp === 'apple_maps' ? '#2563eb' : '#9ca3af'} 
              />
              <Text 
                className={`ml-3 ${
                  localSettings.preferredNavigationApp === 'apple_maps'
                    ? 'text-blue-600 dark:text-blue-400 font-medium'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Apple Maps
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Raio de Pesquisa */}
          <View className="bg-white dark:bg-slate-800 rounded-lg p-4 mb-4">
            <Text className="text-lg text-slate-800 dark:text-slate-200 mb-2">
              Raio de Pesquisa
            </Text>
            
            <View className="flex-row justify-between mb-2">
              {[5, 10, 15, 20].map((radius) => (
                <TouchableOpacity
                  key={radius}
                  className={`py-2 px-4 rounded-lg ${
                    localSettings.searchRadius === radius
                      ? 'bg-blue-600 dark:bg-blue-500'
                      : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                  onPress={() => handleRadiusChange(radius)}
                  testID={`radius${radius}Button`}
                >
                  <Text
                    className={`${
                      localSettings.searchRadius === radius
                        ? 'text-white font-medium'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {radius} km
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {/* Sobre */}
          <View className="bg-white dark:bg-slate-800 rounded-lg p-4 mb-4">
            <Text className="text-lg text-slate-800 dark:text-slate-200 mb-2">
              Sobre
            </Text>
            
            <Text className="text-slate-600 dark:text-slate-400 mb-2">
              Tankup é uma aplicação para encontrar os postos de combustível mais baratos em Portugal.
            </Text>
            
            <Text className="text-slate-600 dark:text-slate-400 mb-2">
              Versão: 1.0.0
            </Text>

           <TouchableOpacity
              className="mt-2"
              onPress={() => Linking.openURL('https://github.com/MiguelAreal')}
            >
              <Text className="text-blue-600 dark:text-blue-400">
                Desenvolvido por Miguel Areal
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="mt-2"
              onPress={() => Linking.openURL('https://precoscombustiveis.dgeg.gov.pt')}
            >
              <Text className="text-blue-600 dark:text-blue-400">
                Dados fornecidos por DGEG
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}