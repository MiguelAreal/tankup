import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Linking, Platform, SafeAreaView, ScrollView, StatusBar, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Strings } from '../types/strings';
import fuelTypesData from './assets/fuelTypes.json';
import stringsEN from './assets/strings.en.json';
import stringsPT from './assets/strings.pt.json';
import { useAppContext } from './context/AppContext';

// Add FuelType interface for local use
interface FuelType {
  id: string;
  icon: string;
}

export default function SettingsScreen() {
  const router = useRouter();
  const { 
    darkMode, 
    setDarkMode, 
    theme,
    preferredNavigationApp, 
    setPreferredNavigationApp, 
    searchRadius, 
    setSearchRadius,
    language,
    setLanguage,
    selectedFuelTypes,
    setSelectedFuelTypes
  } = useAppContext();
  
  const [isMapDropdownOpen, setIsMapDropdownOpen] = useState(false);
  const [isNavDropdownOpen, setIsNavDropdownOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isRadiusDropdownOpen, setIsRadiusDropdownOpen] = useState(false);
  const strings = (language === 'en' ? stringsEN : stringsPT) as Strings;

  // Initialize dropdowns based on current values
  useEffect(() => {
    // Open the dropdowns that match the current values
    setIsMapDropdownOpen(true);
    setIsNavDropdownOpen(true);
    setIsLangDropdownOpen(true);
    setIsRadiusDropdownOpen(true);
  }, []);

  // Apply dark mode class to html element
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const html = document.documentElement;
      if (darkMode) {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }
    }
  }, [darkMode]);

  const handleDarkModeToggle = async (value: boolean) => {
    try {
      await setDarkMode(value);
      // Force update the theme
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', value);
        document.body.style.backgroundColor = value ? '#1a1a1a' : '#ffffff';
      }
    } catch (error) {
      console.error('Error toggling dark mode:', error);
    }
  };

  const handleNavigationAppChange = async (app: 'google_maps' | 'waze' | 'apple_maps') => {
    try {
      await setPreferredNavigationApp(app);
    } catch (error) {
      console.error('Error changing navigation app:', error);
    }
  };

  const handleRadiusChange = async (radius: number) => {
    try {
      await setSearchRadius(radius);
    } catch (error) {
      console.error('Error changing search radius:', error);
    }
  };

  const handleLanguageChange = async (lang: 'en' | 'pt') => {
    try {
      await setLanguage(lang);
      setIsLangDropdownOpen(false);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  const handleFuelTypeToggle = async (fuelType: string) => {
    try {
      const isSelected = selectedFuelTypes.includes(fuelType);
      if (isSelected) {
        if (selectedFuelTypes.length > 1) {
          await setSelectedFuelTypes(selectedFuelTypes.filter((type: string) => type !== fuelType));
        }
      } else {
        if (selectedFuelTypes.length < 6) {
          await setSelectedFuelTypes([...selectedFuelTypes, fuelType]);
        }
      }
    } catch (error) {
      console.error('Error toggling fuel type:', error);
    }
  };

  const getCurrentNavAppName = () => {
    switch (preferredNavigationApp) {
      case 'google_maps':
        return 'Google Maps';
      case 'waze':
        return 'Waze';
      case 'apple_maps':
        return 'Apple Maps';
      default:
        return 'Google Maps';
    }
  };

  const getCurrentLanguageName = () => {
    switch (language) {
      case 'pt':
        return 'Português';
      case 'en':
        return 'English';
      default:
        return 'Português';
    }
  };

  const getCurrentRadiusText = () => {
    return `${searchRadius} km`;
  };
  
  return (
    <>
      <StatusBar 
        barStyle={darkMode ? 'light-content' : 'dark-content'}
        translucent={true}
        backgroundColor="transparent"
      />
      <SafeAreaView 
        className="flex-1"
        style={{ 
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
          backgroundColor: theme.background
        }}
      >
        <ScrollView className="flex-1">
          {/* Back Button */}
          <View style={{ backgroundColor: theme.card }}>
            <TouchableOpacity 
              onPress={() => router.replace('/')}
              className="flex-row items-center px-4 py-2"
            >
              <Ionicons name="arrow-back" size={24} color={theme.primary} />
              <Text style={{ 
                marginLeft: 8,
                fontSize: 20,
                fontWeight: '600',
                color: theme.primary
              }}>
                {strings.settings.title}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View className="p-4">
            {/* Dark Mode Toggle */}
            <View style={{ 
              backgroundColor: theme.card,
              borderRadius: 8,
              padding: 16,
              marginBottom: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2
            }}>
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center">
                  <Ionicons name="moon" size={24} color={theme.primary} />
                  <Text style={{ 
                    marginLeft: 12,
                    fontSize: 18,
                    color: theme.text
                  }}>
                    {strings.settings.darkMode}
                  </Text>
                </View>
                <Switch
                  value={darkMode}
                  onValueChange={handleDarkModeToggle}
                  trackColor={{ false: '#d1d5db', true: theme.primary }}
                  thumbColor={darkMode ? '#ffffff' : '#f3f4f6'}
                  testID="darkModeSwitch"
                />
              </View>
            </View>
            
            {/* Preferred Navigation App */}
            <View style={{ 
              backgroundColor: theme.card,
              borderRadius: 8,
              padding: 16,
              marginBottom: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2
            }}>
              <TouchableOpacity 
                className="flex-row justify-between items-center"
                onPress={() => setIsNavDropdownOpen(!isNavDropdownOpen)}
              >
                <View className="flex-row items-center">
                  <Ionicons name="navigate" size={20} color={theme.primary} />
                  <Text style={{ 
                    marginLeft: 12,
                    fontSize: 18,
                    color: theme.text
                  }}>
                    {strings.settings.navigationApp}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Text style={{ 
                    marginRight: 8,
                    color: theme.text
                  }}>
                    {getCurrentNavAppName()}
                  </Text>
                  <Ionicons 
                    name={isNavDropdownOpen ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={darkMode ? "#94a3b8" : "#64748b"} 
                  />
                </View>
              </TouchableOpacity>
              
              {isNavDropdownOpen && (
                <View className="mt-2 border-t border-slate-200 dark:border-slate-700">
                  <TouchableOpacity 
                    className={`p-4 rounded-lg ${
                      preferredNavigationApp === 'google_maps' 
                        ? 'bg-blue-50 dark:bg-blue-900/30' 
                        : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
                    onPress={() => {
                      handleNavigationAppChange('google_maps');
                      setIsNavDropdownOpen(false);
                    }}
                  >
                    <Text 
                      className={`${
                        preferredNavigationApp === 'google_maps'
                          ? 'text-blue-600 dark:text-blue-400 font-medium'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Google Maps
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    className={`p-4 rounded-lg ${
                      preferredNavigationApp === 'waze' 
                        ? 'bg-blue-50 dark:bg-blue-900/30' 
                        : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
                    onPress={() => {
                      handleNavigationAppChange('waze');
                      setIsNavDropdownOpen(false);
                    }}
                  >
                    <Text 
                      className={`${
                        preferredNavigationApp === 'waze'
                          ? 'text-blue-600 dark:text-blue-400 font-medium'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Waze
                    </Text>
                  </TouchableOpacity>

                  {Platform.OS === 'ios' && (
                    <TouchableOpacity 
                      className={`p-4 rounded-lg ${
                        preferredNavigationApp === 'apple_maps' 
                          ? 'bg-blue-50 dark:bg-blue-900/30' 
                        : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                      }`}
                      onPress={() => {
                        handleNavigationAppChange('apple_maps');
                        setIsNavDropdownOpen(false);
                      }}
                    >
                      <Text 
                        className={`${
                          preferredNavigationApp === 'apple_maps'
                            ? 'text-blue-600 dark:text-blue-400 font-medium'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Apple Maps
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            {/* Search Radius */}
            <View style={{ 
              backgroundColor: theme.card,
              borderRadius: 8,
              padding: 16,
              marginBottom: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2
            }}>
              <TouchableOpacity 
                className="flex-row justify-between items-center"
                onPress={() => setIsRadiusDropdownOpen(!isRadiusDropdownOpen)}
              >
                <View className="flex-row items-center">
                  <Ionicons name="location" size={20} color={theme.primary} />
                  <Text style={{ 
                    marginLeft: 12,
                    fontSize: 18,
                    color: theme.text
                  }}>
                    {strings.settings.searchRadius}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Text style={{ 
                    marginRight: 8,
                    color: theme.text
                  }}>
                    {getCurrentRadiusText()}
                  </Text>
                  <Ionicons 
                    name={isRadiusDropdownOpen ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={darkMode ? "#94a3b8" : "#64748b"} 
                  />
                </View>
              </TouchableOpacity>

              {isRadiusDropdownOpen && (
                <View className="mt-2 border-t border-slate-200 dark:border-slate-700">
                  <View className="flex-row justify-between mt-4 gap-2">
                    {[5, 10, 15, 20].map((radius) => (
                      <TouchableOpacity
                        key={radius}
                        className={`flex-1 py-2 rounded-lg ${
                          searchRadius === radius
                            ? 'bg-blue-600 dark:bg-blue-500'
                            : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                        onPress={() => {
                          handleRadiusChange(radius);
                          setIsRadiusDropdownOpen(false);
                        }}
                        testID={`radius${radius}Button`}
                      >
                        <Text
                          className={`${
                            searchRadius === radius
                              ? 'text-white font-medium'
                              : 'text-slate-700 dark:text-slate-300'
                          } text-center`}
                        >
                          {radius} km
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
            
            {/* Language Selection */}
            <View style={{ 
              backgroundColor: theme.card,
              borderRadius: 8,
              padding: 16,
              marginBottom: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2
            }}>
              <TouchableOpacity 
                className="flex-row justify-between items-center"
                onPress={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              >
                <View className="flex-row items-center">
                  <Ionicons name="language" size={20} color={theme.primary} />
                  <Text style={{ 
                    marginLeft: 12,
                    fontSize: 18,
                    color: theme.text
                  }}>
                    {strings.settings.language}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Text style={{ 
                    marginRight: 8,
                    color: theme.text
                  }}>
                    {getCurrentLanguageName()}
                  </Text>
                  <Ionicons 
                    name={isLangDropdownOpen ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={darkMode ? "#94a3b8" : "#64748b"} 
                  />
                </View>
              </TouchableOpacity>
              
              {isLangDropdownOpen && (
                <View className="mt-2 border-t border-slate-200 dark:border-slate-700">
                  <TouchableOpacity 
                    className={`p-4 rounded-lg ${
                      language === 'pt' 
                        ? 'bg-blue-50 dark:bg-blue-900/30' 
                        : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
                    onPress={() => {
                      handleLanguageChange('pt');
                      setIsLangDropdownOpen(false);
                    }}
                  >
                    <Text 
                      className={`${
                        language === 'pt'
                          ? 'text-blue-600 dark:text-blue-400 font-medium'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Português
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    className={`p-4 rounded-lg ${
                      language === 'en' 
                        ? 'bg-blue-50 dark:bg-blue-900/30' 
                        : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
                    onPress={() => {
                      handleLanguageChange('en');
                      setIsLangDropdownOpen(false);
                    }}
                  >
                    <Text 
                      className={`${
                        language === 'en'
                          ? 'text-blue-600 dark:text-blue-400 font-medium'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      English
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Fuel Type Selection */}
            <View style={{ 
              backgroundColor: theme.card,
              borderRadius: 8,
              padding: 16,
              marginBottom: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2
            }}>
              <View className="flex-row items-center mb-2">
                <Ionicons name="water" size={24} color={theme.primary} />
                <Text style={{ 
                  marginLeft: 12,
                  fontSize: 18,
                  color: theme.text
                }}>
                  {strings.settings.fuelType}
                </Text>
              </View>
              
              <Text style={{ 
                marginBottom: 16,
                color: theme.text
              }}>
                {language === 'en' 
                  ? 'Select up to 6 fuel types to display in the main screen'
                  : 'Selecione até 6 tipos de combustível para exibir na tela principal'}
              </Text>

              <View className="flex-row flex-wrap">
                {fuelTypesData.types.map((type: FuelType) => (
                  <TouchableOpacity
                    key={type.id}
                    className={`mr-2 mb-2 p-2 px-4 rounded-lg ${
                      selectedFuelTypes.includes(type.id)
                        ? 'bg-blue-600 dark:bg-blue-500'
                        : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                    onPress={() => handleFuelTypeToggle(type.id)}
                  >
                    <View className="flex-row items-center">
                      <Ionicons
                        name={type.icon as any}
                        size={20}
                        color={selectedFuelTypes.includes(type.id) ? '#ffffff' : darkMode ? '#94a3b8' : '#64748b'}
                      />
                      <Text
                        className={`ml-2 ${
                          selectedFuelTypes.includes(type.id)
                            ? 'text-white font-medium'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {strings.station.fuelType[type.id as keyof typeof strings.station.fuelType]}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* About */}
            <View style={{ 
              backgroundColor: theme.card,
              borderRadius: 8,
              padding: 16,
              marginBottom: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2
            }}>
              <View className="flex-row items-center mb-2">
                <Ionicons name="information-circle" size={24} color={theme.primary} />
                <Text style={{ 
                  marginLeft: 12,
                  fontSize: 18,
                  color: theme.text
                }}>
                  {strings.settings.about}
                </Text>
              </View>
              
              <Text style={{ 
                marginBottom: 8,
                color: theme.text
              }}>
                {strings.settings.aboutText}
              </Text>
              
              <Text style={{ 
                color: theme.text
              }}>
                {strings.settings.version}: 1.0.0
              </Text>

              <TouchableOpacity
                className="mt-2"
                onPress={() => Linking.openURL('https://github.com/MiguelAreal')}
              >
                <Text style={{ 
                  color: theme.text
                }}>
                  {strings.settings.developer}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="mt-2"
                onPress={() => Linking.openURL('https://precoscombustiveis.dgeg.gov.pt')}
              >
                <Text style={{ 
                  color: theme.text
                }}>
                  {strings.settings.provider}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}