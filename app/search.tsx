import { Ionicons } from '@expo/vector-icons';
import Voice, { SpeechResultsEvent } from '@react-native-voice/voice';
import { useRouter } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AppContext } from '../context/AppContext';
import locations from './assets/locations.json';
import stringsEN from './assets/strings.en.json';
import stringsPT from './assets/strings.pt.json';
import { Strings } from './types/strings';

type SearchResult = {
  type: 'district' | 'city';
  id: string;
  name: string;
  districtName?: string;
};

export default function SearchScreen() {
  const router = useRouter();
  const { language, darkMode } = useContext(AppContext);
  const strings = (language === 'en' ? stringsEN : stringsPT) as Strings;
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [isVoiceAvailable, setIsVoiceAvailable] = useState(false);

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

  useEffect(() => {
    const initVoice = async () => {
      try {
        await Voice.isAvailable();
        setIsVoiceAvailable(true);
        Voice.onSpeechResults = onSpeechResults;
        Voice.onSpeechError = onSpeechError;
      } catch (error) {
        console.error('Voice recognition not available:', error);
        setIsVoiceAvailable(false);
      }
    };

    initVoice();

    return () => {
      if (isVoiceAvailable) {
        Voice.destroy().then(() => {
          Voice.removeAllListeners();
        }).catch(error => {
          console.error('Error cleaning up voice:', error);
        });
      }
    };
  }, []);

  const onSpeechResults = (e: SpeechResultsEvent) => {
    if (e.value && e.value.length > 0) {
      setSearchQuery(e.value[0]);
    }
  };

  const onSpeechError = (e: any) => {
    console.error('Speech recognition error:', e);
    setIsListening(false);
  };

  // Combine districts and cities into a single searchable list
  const searchResults: SearchResult[] = React.useMemo(() => {
    if (!searchQuery) return [];

    const query = searchQuery.toLowerCase();
    const results: SearchResult[] = [];

    // Add matching districts
    locations.districts.forEach(district => {
      if (district.name.toLowerCase().includes(query)) {
        results.push({
          type: 'district',
          id: district.id,
          name: district.name
        });
      }

      // Add matching cities from this district
      district.cities.forEach(city => {
        if (city.toLowerCase().includes(query)) {
          results.push({
            type: 'city',
            id: city,
            name: city,
            districtName: district.name
          });
        }
      });
    });

    // Sort results: districts first, then cities alphabetically
    return results.sort((a, b) => {
      if (a.type === b.type) {
        return a.name.localeCompare(b.name);
      }
      return a.type === 'district' ? -1 : 1;
    });
  }, [searchQuery]);

  const handleVoiceInput = async () => {
    if (!isVoiceAvailable) {
      console.log('Voice recognition is not available');
      return;
    }

    try {
      setIsListening(true);
      await Voice.start(language === 'pt' ? 'pt-PT' : 'en-US');
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      setIsListening(false);
    }
  };

  const stopListening = async () => {
    if (!isVoiceAvailable) return;

    try {
      await Voice.stop();
    } catch (error) {
      console.error('Error stopping voice recognition:', error);
    } finally {
      setIsListening(false);
    }
  };

  const handleResultPress = (result: SearchResult) => {
    if (result.type === 'district') {
      setSelectedDistrict(result.id);
      setSearchQuery(''); // Clear search when selecting a district
    } else {
      setSelectedDistrict(null); // Clear selected district when choosing a city
      // Handle city selection
      router.replace('/'); // Use replace instead of back to ensure we go to the map
    }
  };

  const handleBackPress = () => {
    router.replace('/');
  };

  // Get cities for the selected district (only used when not searching)
  const districtCities = React.useMemo(() => {
    if (!selectedDistrict || searchQuery) return [];
    const district = locations.districts.find(d => d.id === selectedDistrict);
    return district?.cities || [];
  }, [selectedDistrict, searchQuery]);

  return (
    <SafeAreaView className="flex-1 bg-slate-100 dark:bg-slate-900">
      {/* Header */}
      <View className="px-4 py-2">
        <TouchableOpacity 
          onPress={handleBackPress}
          className="flex-row items-center"
        >
          <Ionicons name="arrow-back" size={24} color="#2563eb" />
          <Text className="ml-2 text-xl font-semibold text-blue-600 dark:text-blue-400">
            {strings.search.title}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View className="p-4">
        <View className="bg-white dark:bg-slate-800 rounded-lg flex-row items-center px-4">
          <Ionicons name="search" size={20} color="#64748b" />
          <TextInput
            className="flex-1 py-3 px-2 text-slate-800 dark:text-slate-200"
            placeholder={strings.search.placeholder}
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#64748b" />
            </TouchableOpacity>
          ) : isVoiceAvailable ? (
            <TouchableOpacity 
              onPress={isListening ? stopListening : handleVoiceInput}
              className={`p-2 ${isListening ? 'bg-red-100 dark:bg-red-900' : ''}`}
            >
              <Ionicons 
                name={isListening ? "mic" : "mic-outline"} 
                size={20} 
                color={isListening ? "#ef4444" : "#64748b"} 
              />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Content */}
      <ScrollView className="flex-1 px-4">
        {searchQuery.length > 0 ? (
          // Mostrar resultados de pesquisa globais (distritos + cidades)
          <View>
            {searchResults.map((result) => (
              <TouchableOpacity
                key={`${result.type}-${result.id}`}
                className="bg-white dark:bg-slate-800 rounded-lg p-4 mb-2"
                onPress={() => handleResultPress(result)}
              >
                <View className="flex-row items-center">
                  <Ionicons 
                    name={result.type === 'district' ? 'location' : 'location-outline'} 
                    size={20} 
                    color="#64748b" 
                    className="mr-2"
                  />
                  <View>
                    <Text className="text-slate-800 dark:text-slate-200 font-medium">
                      {result.name}
                    </Text>
                    {result.type === 'city' && result.districtName && (
                      <Text className="text-slate-500 dark:text-slate-400 text-sm">
                        {result.districtName}
                      </Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : !selectedDistrict ? (
          // Districts List
          <View>
            <Text className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
              {strings.search.selectDistrict}
            </Text>
            {locations.districts.map(district => (
              <TouchableOpacity
                key={district.id}
                className="bg-white dark:bg-slate-800 rounded-lg p-4 mb-2"
                onPress={() => setSelectedDistrict(district.id)}
              >
                <Text className="text-slate-800 dark:text-slate-200 font-medium">
                  {district.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          // Cities List for selected district
          <View>
            <View className="flex-row items-center mb-4">
              <TouchableOpacity
                onPress={() => setSelectedDistrict(null)}
                className="mr-2"
              >
                <Ionicons name="arrow-back" size={24} color="#64748b" />
              </TouchableOpacity>
              <Text className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                {locations.districts.find(d => d.id === selectedDistrict)?.name}
              </Text>
            </View>
            {districtCities.map(city => (
              <TouchableOpacity
                key={city}
                className="bg-white dark:bg-slate-800 rounded-lg p-4 mb-2"
                onPress={() => {
                  setSelectedDistrict(null); // Clear selected district when choosing a city
                  router.replace('/'); // Use replace instead of back to ensure we go to the map
                }}
              >
                <Text className="text-slate-800 dark:text-slate-200 font-medium">
                  {city}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}