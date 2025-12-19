import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Theme } from '../../interfaces/theme';

interface FavoritesHeaderProps {
  title: string;
  onBack: () => void;
  theme: Theme;
}

export const FavoritesHeader: React.FC<FavoritesHeaderProps> = ({ title, onBack, theme }) => (
  <View 
    style={{ backgroundColor: theme.background }} 
    className="px-4 py-2 flex-row items-center border-b border-transparent"
  >
    <TouchableOpacity onPress={onBack} className="flex-row items-center py-2">
      <Ionicons name="arrow-back" size={24} color={theme.primary} />
      <Text style={{ color: theme.primary }} className="ml-2 text-xl font-semibold">
        {title}
      </Text>
    </TouchableOpacity>
  </View>
);