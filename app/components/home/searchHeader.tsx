import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';
import { useAppContext } from '../../context/AppContext';

interface SearchHeaderProps {
  searchState: any;
  onClearSearch: () => void;
}

export const SearchHeader: React.FC<SearchHeaderProps> = ({ 
  searchState, 
  onClearSearch 
}) => {
  const { theme } = useAppContext();
  const { t } = useTranslation();

  return (
    <View style={{ backgroundColor: theme.background }} className="px-4 py-2 flex-row items-center justify-between">
      <View className="flex-row items-center flex-1">
        <Ionicons name="search" size={20} color={theme.primary} />
        <Text style={{ color: theme.text }} className="ml-2 flex-1">
          {searchState.municipio 
            ? `${searchState.municipio}, ${searchState.distrito}`
            : searchState.distrito}
        </Text>
      </View>
      <TouchableOpacity
        onPress={onClearSearch}
        className="ml-2 px-3 py-1 rounded-lg"
        style={{ backgroundColor: theme.primaryLight }}
      >
        <Text style={{ color: theme.primary }} className="font-medium">
          {t('search.clear')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};