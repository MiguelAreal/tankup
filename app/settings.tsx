import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Platform, SafeAreaView, ScrollView, StatusBar, Switch, Text, TouchableOpacity, View } from 'react-native';

import fuelTypesData from './assets/fuelTypes.json';
import { OptionItem, SettingsRow, SettingsSection } from './components/settings';
import { useAppContext } from './context/AppContext';
import { getCurrentVersion } from './utils/versionCheck';

// Types
type DropdownState = {
  nav: boolean;
  lang: boolean;
  radius: boolean;
  brands: boolean;
  fuel: boolean;
};

export default function SettingsScreen() {
  const router = useRouter();
  const appVersion = getCurrentVersion();
  const { t } = useTranslation(); 

  const { 
    darkMode, setDarkMode, theme,
    preferredNavigationApp, setPreferredNavigationApp, 
    searchRadius, setSearchRadius,
    language, setLanguage,
    selectedFuelTypes, setSelectedFuelTypes,
    availableFuelTypes,
    availableBrands,
    excludedBrands,
    toggleExcludedBrand
  } = useAppContext();
  
  const [dropdowns, setDropdowns] = useState<DropdownState>({
    nav: true,
    lang: true,
    radius: true,
    brands: false,
    fuel: false // <--- Inicia fechado para manter o ecrã limpo
  });

  const toggleDropdown = (key: keyof DropdownState) => {
    setDropdowns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Web Dark Mode Handler
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const html = document.documentElement;
      if (darkMode) {
        html.classList.add('dark');
        document.body.style.backgroundColor = '#1a1a1a';
      } else {
        html.classList.remove('dark');
        document.body.style.backgroundColor = '#ffffff';
      }
    }
  }, [darkMode]);

  // Logic Handlers
  const handleFuelTypeToggle = useCallback(async (fuelType: string) => {
    try {
      const isSelected = selectedFuelTypes.includes(fuelType);
      let newTypes = [...selectedFuelTypes];

      if (isSelected) {
        if (newTypes.length > 1) newTypes = newTypes.filter(t => t !== fuelType);
      } else {
        if (newTypes.length < 6) newTypes.push(fuelType);
      }
      
      if (newTypes.length !== selectedFuelTypes.length) {
        await setSelectedFuelTypes(newTypes);
      }
    } catch (error) {
      console.error('Error toggling fuel type:', error);
    }
  }, [selectedFuelTypes, setSelectedFuelTypes]);

  // Display Helpers
  const getNavAppName = (app: string) => {
    const names = { google_maps: 'Google Maps', waze: 'Waze', apple_maps: 'Apple Maps' };
    return names[app as keyof typeof names] || 'Google Maps';
  };
  const getLangName = (lang: string) => (lang === 'pt' ? 'Português' : 'English');

  return (
    <>
      <StatusBar 
        barStyle={darkMode ? 'light-content' : 'dark-content'}
        translucent={true} 
        backgroundColor="transparent" 
      />
      
      <SafeAreaView style={{ flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, backgroundColor: theme.background }}>
        
        {/* Header */}
        <View style={{ backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: darkMode ? '#333' : '#f0f0f0' }}>
          <TouchableOpacity onPress={() => router.replace('/')} className="flex-row items-center px-4 py-3">
            <Ionicons name="arrow-back" size={24} color={theme.primary} />
            <Text className="ml-3 text-xl font-semibold" style={{ color: theme.primary }}>
              {t('settings.title')}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-4 pt-6" showsVerticalScrollIndicator={false}>
          
          {/* 1. Dark Mode */}
          <SettingsSection theme={theme}>
            <SettingsRow 
              icon="moon"
              label={t('settings.darkMode')}
              theme={theme}
              value={
                <Switch
                  value={darkMode}
                  onValueChange={setDarkMode}
                  trackColor={{ false: '#d1d5db', true: theme.primary }}
                  thumbColor={Platform.OS === 'ios' ? '#ffffff' : (darkMode ? '#ffffff' : '#f3f4f6')}
                />
              }
            />
          </SettingsSection>
          
          {/* 2. Navigation App */}
          <SettingsSection theme={theme}>
            <SettingsRow 
              icon="navigate"
              label={t('settings.navigationApp')}
              value={getNavAppName(preferredNavigationApp)}
              isOpen={dropdowns.nav}
              onPress={() => toggleDropdown('nav')}
              showChevron
              theme={theme}
            />
            {dropdowns.nav && (
              <View className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                {['google_maps', 'waze', ...(Platform.OS === 'ios' ? ['apple_maps'] : [])].map((app) => (
                  <OptionItem 
                    key={app}
                    label={getNavAppName(app)}
                    isSelected={preferredNavigationApp === app}
                    onPress={() => setPreferredNavigationApp(app as any)}
                    theme={theme}
                  />
                ))}
              </View>
            )}
          </SettingsSection>

          {/* 3. Search Radius */}
          <SettingsSection theme={theme}>
            <SettingsRow 
              icon="location"
              label={t('settings.searchRadius')}
              value={`${searchRadius} km`}
              isOpen={dropdowns.radius}
              onPress={() => toggleDropdown('radius')}
              showChevron
              theme={theme}
            />
            {dropdowns.radius && (
              <View className="mt-4 flex-row gap-2 justify-between">
                {[5, 10, 15, 20].map((r) => {
                  const isActive = searchRadius === r;
                  return (
                    <TouchableOpacity
                      key={r}
                      onPress={() => setSearchRadius(r)}
                      className="flex-1 py-3 rounded-lg items-center justify-center"
                      style={{ backgroundColor: isActive ? theme.primary : (darkMode ? '#334155' : '#e2e8f0') }}
                    >
                      <Text className="font-semibold" style={{ color: isActive ? '#fff' : theme.text }}>
                        {r} km
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </SettingsSection>

          {/* 4. Language */}
          <SettingsSection theme={theme}>
            <SettingsRow 
              icon="language"
              label={t('settings.language')}
              value={getLangName(language)}
              isOpen={dropdowns.lang}
              onPress={() => toggleDropdown('lang')}
              showChevron
              theme={theme}
            />
            {dropdowns.lang && (
              <View className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                {['pt', 'en'].map((lang) => (
                  <OptionItem 
                    key={lang}
                    label={getLangName(lang)}
                    isSelected={language === lang}
                    onPress={() => setLanguage(lang as any)}
                    theme={theme}
                  />
                ))}
              </View>
            )}
          </SettingsSection>

          {/* 5. Fuel Types (AGORA COLAPSÁVEL) */}
          <SettingsSection theme={theme}>
            <SettingsRow 
              icon="water" 
              label={t('settings.fuelType')} 
              // Mostra quantos estão selecionados quando fechado
              value={`${selectedFuelTypes.length} ${t('settings.selected', { defaultValue: 'selecionados'})}`}
              isOpen={dropdowns.fuel}
              onPress={() => toggleDropdown('fuel')}
              showChevron
              theme={theme} 
            />

            {dropdowns.fuel && (
              <View className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Text className="mb-3 text-sm leading-5" style={{ color: theme.textSecondary || theme.text, opacity: 0.8 }}>
                  {t('settings.selectMaxFuels', { count: 6, defaultValue: 'Select up to 6 fuel types to display.' })}
                </Text>

                <View className="flex-row flex-wrap -mx-1">
                  {(availableFuelTypes.length ? availableFuelTypes : fuelTypesData.types.map((t: any) => t.id)).map((id: string) => {
                    const isActive = selectedFuelTypes.includes(id);
                    const iconName = (fuelTypesData.types.find((t: any) => t.id === id)?.icon || 'water') as any;
                    const label = t(`station.fuelType.${id}`, { defaultValue: id });

                    return (
                      <TouchableOpacity
                        key={id}
                        onPress={() => handleFuelTypeToggle(id)}
                        className="flex-row items-center p-2 px-3 m-1 rounded-lg border"
                        style={{ 
                          backgroundColor: isActive ? theme.primary : 'transparent',
                          borderColor: isActive ? theme.primary : (darkMode ? '#334155' : '#e2e8f0'),
                        }}
                      >
                        <Ionicons 
                          name={iconName} 
                          size={18} 
                          color={isActive ? '#ffffff' : theme.text} 
                        />
                        <Text 
                          className="ml-2 text-sm font-medium" 
                          style={{ color: isActive ? '#ffffff' : theme.text }}
                        >
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </SettingsSection>

          {/* 6. EXCLUDED BRANDS */}
          <SettingsSection theme={theme}>
            <View className="mb-2">
              <SettingsRow 
                icon="eye-off"
                label={t('settings.excludedBrands', { defaultValue: 'Marcas Ignoradas' })}
                value={excludedBrands.length > 0 ? `${excludedBrands.length} ${t('settings.hidden', { defaultValue: 'ocultas'})}` : undefined}
                isOpen={dropdowns.brands}
                onPress={() => toggleDropdown('brands')}
                showChevron
                theme={theme}
              />
              <Text className="mt-1 text-sm leading-5" style={{ color: theme.textSecondary || theme.text, opacity: 0.8 }}>
                {t('settings.excludedBrandsDesc', { defaultValue: 'Ative as marcas que não deseja ver no mapa ou na lista.' })}
              </Text>
            </View>

            {dropdowns.brands && (
              <View className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                {availableBrands.length === 0 ? (
                  <Text style={{ color: theme.textSecondary }} className="py-2 italic">
                    {t('settings.noBrandsAvailable', { defaultValue: 'A carregar marcas...' })}
                  </Text>
                ) : (
                  availableBrands.map((brand) => {
                    const isExcluded = excludedBrands.includes(brand);
                    
                    return (
                      <View 
                        key={brand} 
                        className="flex-row items-center justify-between py-3 border-b border-slate-50 dark:border-slate-800 last:border-0"
                      >
                        <Text style={{ color: theme.text, flex: 1 }} className="font-medium">
                          {brand}
                        </Text>
                        <Switch
                          value={isExcluded}
                          onValueChange={() => toggleExcludedBrand(brand)}
                          trackColor={{ false: '#d1d5db', true: theme.error || '#ef4444' }}
                          thumbColor={'#ffffff'}
                        />
                      </View>
                    );
                  })
                )}
              </View>
            )}
          </SettingsSection>

          {/* 7. About */}
          <SettingsSection theme={theme} className="mb-10">
            <SettingsRow icon="information-circle" label={t('settings.about')} theme={theme} />
            <View className="mt-4 pl-11"> 
              <Text className="text-base mb-4 leading-6" style={{ color: theme.text }}>
                {t('settings.aboutText')}
              </Text>
              
              <Text className="text-sm font-semibold mb-4" style={{ color: theme.textSecondary || theme.text }}>
                {t('settings.version')}: {appVersion}
              </Text>

              <View className="gap-y-3">
                <TouchableOpacity onPress={() => Linking.openURL('https://github.com/MiguelAreal')} className="flex-row items-center">
                  <Ionicons name="logo-github" size={20} color={theme.primary} />
                  <Text className="ml-2 font-medium" style={{ color: theme.primary }}>
                    {t('settings.developer')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => Linking.openURL('https://precoscombustiveis.dgeg.gov.pt')} className="flex-row items-center">
                  <Ionicons name="link" size={20} color={theme.primary} />
                  <Text className="ml-2 font-medium" style={{ color: theme.primary }}>
                    {t('settings.provider')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </SettingsSection>

        </ScrollView>
      </SafeAreaView>
    </>
  );
}