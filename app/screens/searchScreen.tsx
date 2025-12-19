import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Data & Services
import { PriceSortOption, SORT_OPTIONS_LIST } from '@/types/models/PostoSortOption';
import fuelTypesData from '../assets/fuelTypes.json';
import locationsData from '../assets/locations.json';
import { BottomModal, FilterButton, ListItem } from '../components/search'; // Importação limpa
import { useAppContext } from '../context/AppContext';
import { useSearch } from '../context/SearchContext';
import { StationService } from '../network/stationService';

// Types
type District = { id: string; name: string; cities: string[] };
type CityData = { district: District; city: string };
type ScreenMode = 'districts' | 'cities';

export default function SearchScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { selectedFuelTypes, theme } = useAppContext();
  const { setSearchState } = useSearch();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  
  const [selectedFuelType, setSelectedFuelType] = useState(selectedFuelTypes[0] || '');
  const [selectedSort, setSelectedSort] = useState<PriceSortOption>(SORT_OPTIONS_LIST[0]);
  const [currentScreen, setCurrentScreen] = useState<ScreenMode>('districts');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modals, setModals] = useState({ fuel: false, sort: false });

  // Logic
  const { filteredDistricts, filteredCities } = useMemo(() => {
    const query = searchQuery.toLowerCase();
    let districts: District[] = locationsData.districts;
    let cities: CityData[] = [];

    if (currentScreen === 'districts') {
      if (query) {
        districts = locationsData.districts.filter(d => d.name.toLowerCase().includes(query));
        cities = locationsData.districts.flatMap(d => 
          d.cities
            .filter(c => c.toLowerCase().includes(query))
            .map(c => ({ district: d, city: c }))
        );
      }
    } else if (selectedDistrict) {
      cities = selectedDistrict.cities
        .filter(c => c.toLowerCase().includes(query))
        .map(c => ({ district: selectedDistrict, city: c }));
    }

    return { filteredDistricts: districts, filteredCities: cities };
  }, [searchQuery, currentScreen, selectedDistrict]);

  // Handlers
  const handleDistrictSelect = useCallback((district: District) => {
    setSelectedDistrict(district);
    setCurrentScreen('cities');
    setSearchQuery('');
  }, []);

  const handleCitySelect = useCallback((cityData: CityData) => {
    setSelectedDistrict(cityData.district);
    setSelectedCity(cityData.city);
    setCurrentScreen('cities');
  }, []);

  const handleBackPress = useCallback(() => {
    if (currentScreen === 'cities' && !selectedCity) { 
      setCurrentScreen('districts');
      setSelectedDistrict(null);
      setSearchQuery('');
    } else if (currentScreen === 'cities' && selectedCity) {
      setSelectedCity(null);
    } else {
      router.replace('/');
    }
  }, [currentScreen, selectedCity, router]);

  const handleSearch = async () => {
    if (!selectedFuelType) {
      setError(t('search.errorFuel')); 
      return;
    }
    if (!selectedDistrict && !selectedCity) {
      setError(t('search.errorLocation'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const results = await StationService.getByLocation({
        distrito: selectedDistrict?.name,
        municipio: selectedCity || undefined,
        fuelType: selectedFuelType,
        sortBy: selectedSort
      });
      
      setSearchState({
        results,
        searchType: 'location',
        distrito: selectedDistrict?.name,
        municipio: selectedCity || undefined,
        fuelType: selectedFuelType,
        sortBy: selectedSort
      });
      
      router.replace('/');
    } catch (err) {
      setError(t('error.searchFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.background }}>
      {/* HEADER */}
      <View className="px-4 py-2 flex-row items-center justify-between">
        <TouchableOpacity onPress={handleBackPress} className="flex-row items-center py-2">
          <Ionicons name="arrow-back" size={24} color={theme.primary} />
          <Text className="ml-2 text-xl font-semibold" style={{ color: theme.primary }}>
            {currentScreen === 'districts' ? t('search.district') : selectedDistrict?.name}
          </Text>
        </TouchableOpacity>

        <View className="flex-row">
          <FilterButton
            icon={selectedFuelType ? "checkmark-circle" : "options"}
            label={selectedFuelType ? t(`station.fuelType.${selectedFuelType}`) : t('search.fuelType')}
            isActive={!!selectedFuelType}
            onPress={() => setModals(m => ({ ...m, fuel: true }))}
            theme={theme}
          />
          <FilterButton
            icon={selectedSort === 'mais_barato' ? 'trending-down' : 'trending-up'}
            label={selectedSort === 'mais_barato' ? t('station.sortBy.mais_barato') : t('station.sortBy.mais_caro')}
            isActive={true}
            onPress={() => setModals(m => ({ ...m, sort: true }))}
            theme={theme}
          />
        </View>
      </View>

      {/* SEARCH INPUT */}
      <View className="px-4 py-3">
        <TextInput
          className="p-4 rounded-lg text-base"
          style={{ backgroundColor: theme.card, color: theme.text }}
          placeholder={currentScreen === 'districts' ? t('search.placeholder') : t('search.municipality')}
          placeholderTextColor={theme.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* MAIN LIST */}
      <ScrollView className="flex-1 px-4" keyboardShouldPersistTaps="handled">
        {currentScreen === 'districts' ? (
          <>
            {searchQuery && filteredCities.length > 0 && (
              <View className="mb-6">
                <Text className="text-base font-semibold mb-3" style={{ color: theme.text }}>{t('search.municipality')}</Text>
                {filteredCities.map((data) => (
                  <ListItem
                    key={`${data.district.id}-${data.city}`}
                    title={data.city}
                    subtitle={data.district.name}
                    onPress={() => handleCitySelect(data)}
                    theme={theme}
                  />
                ))}
              </View>
            )}

            <View>
              {(!searchQuery || filteredDistricts.length > 0) && (
                 <Text className="text-base font-semibold mb-3" style={{ color: theme.text }}>{t('search.district')}</Text>
              )}
              {filteredDistricts.map((district) => (
                <ListItem
                  key={district.id}
                  title={district.name}
                  subtitle={`${district.cities.length} ${t('search.municipality').toLowerCase()}`}
                  onPress={() => handleDistrictSelect(district)}
                  theme={theme}
                />
              ))}
            </View>
          </>
        ) : (
          filteredCities.map((data) => (
            <ListItem
              key={data.city}
              title={data.city}
              subtitle={data.district.name}
              isActive={selectedCity === data.city}
              onPress={() => setSelectedCity(data.city)}
              theme={theme}
            />
          ))
        )}
      </ScrollView>

      {/* SEARCH BUTTON */}
      {currentScreen === 'cities' && (
        <View className="p-4 border-t border-slate-100 dark:border-slate-800" style={{ backgroundColor: theme.background }}>
          <TouchableOpacity
            className={`p-4 rounded-lg shadow-sm ${!selectedFuelType ? 'opacity-50' : ''}`}
            style={{ backgroundColor: selectedFuelType ? theme.primary : theme.textSecondary }}
            onPress={handleSearch}
            disabled={isLoading || !selectedFuelType}
          >
            {isLoading ? <ActivityIndicator color="#ffffff" /> : (
              <Text className="text-white text-center font-medium text-lg">{t('search.search')}</Text>
            )}
          </TouchableOpacity>
          {error && <Text className="text-red-500 mt-2 text-center">{error}</Text>}
        </View>
      )}

      {/* MODALS */}
      <BottomModal
        visible={modals.fuel}
        onClose={() => setModals(m => ({ ...m, fuel: false }))}
        title={t('search.fuelType')}
      >
        {fuelTypesData.types
          .filter(t => selectedFuelTypes.includes(t.id))
          .map((type) => {
            const isActive = selectedFuelType === type.id;
            return (
              <TouchableOpacity
                key={type.id}
                className={`p-4 border-b border-slate-100 dark:border-slate-700 flex-row items-center ${isActive ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                onPress={() => { setSelectedFuelType(type.id); setModals(m => ({ ...m, fuel: false })); }}
              >
                <Ionicons name={type.icon as any} size={24} color={isActive ? theme.primary : theme.textSecondary} />
                <Text className="ml-3 text-lg" style={{ color: isActive ? theme.primary : theme.text }}>
                  {t(`station.fuelType.${type.id}`)}
                </Text>
              </TouchableOpacity>
            );
          })}
      </BottomModal>

      <BottomModal
        visible={modals.sort}
        onClose={() => setModals(m => ({ ...m, sort: false }))}
        title={t('search.sortBy')}
      >
        {(['mais_barato', 'mais_caro'] as const).map((sortType) => {
           const isActive = selectedSort === sortType;
           return (
            <TouchableOpacity
              key={sortType}
              className={`p-4 border-b border-slate-100 dark:border-slate-700 flex-row items-center ${isActive ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
              onPress={() => { setSelectedSort(sortType); setModals(m => ({ ...m, sort: false })); }}
            >
              <Ionicons name={sortType === 'mais_barato' ? 'trending-down' : 'trending-up'} size={24} color={isActive ? theme.primary : theme.textSecondary} />
              <Text className="ml-3 text-lg" style={{ color: isActive ? theme.primary : theme.text }}>
                {sortType === 'mais_barato' ? t('station.sortBy.mais_barato') : t('station.sortBy.mais_caro')}
              </Text>
            </TouchableOpacity>
           );
        })}
      </BottomModal>
    </SafeAreaView>
  );
}