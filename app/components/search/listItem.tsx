import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { Theme } from '../../interfaces/theme';

interface ListItemProps {
  title: string;
  subtitle?: string;
  isActive?: boolean;
  onPress: () => void;
  theme: Theme;
}

export const ListItem: React.FC<ListItemProps> = ({ 
  title, 
  subtitle, 
  isActive, 
  onPress, 
  theme 
}) => (
  <TouchableOpacity
    onPress={onPress}
    className={`p-4 mb-3 rounded-lg shadow-sm ${
      isActive ? 'bg-blue-600' : 'bg-white dark:bg-slate-800'
    }`}
  >
    <Text className={`text-lg font-medium ${isActive ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>
      {title}
    </Text>
    {subtitle && (
      <Text className={`text-sm mt-1 ${isActive ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>
        {subtitle}
      </Text>
    )}
  </TouchableOpacity>
);