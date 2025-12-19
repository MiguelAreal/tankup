import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { Theme } from '../../interfaces/theme';

interface FilterButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  isActive: boolean;
  onPress: () => void;
  theme: Theme;
}

export const FilterButton: React.FC<FilterButtonProps> = ({ 
  icon, 
  label, 
  isActive, 
  onPress, 
  theme 
}) => (
  <TouchableOpacity
    onPress={onPress}
    className={`px-3 py-2 rounded-lg flex-row items-center mr-2 bg-white dark:bg-slate-800`}
  >
    <Ionicons
      name={icon}
      size={20}
      color={isActive ? theme.primary : "#64748b"}
    />
    <Text className={`ml-2 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>
      {label}
    </Text>
  </TouchableOpacity>
);