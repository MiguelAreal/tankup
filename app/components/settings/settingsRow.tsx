import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Theme } from '../../interfaces/theme';

interface SettingsRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string | React.ReactNode;
  isOpen?: boolean;
  onPress?: () => void;
  theme: Theme;
  showChevron?: boolean;
}

export const SettingsRow: React.FC<SettingsRowProps> = ({ 
  icon, 
  label, 
  value, 
  isOpen, 
  onPress, 
  theme, 
  showChevron = false 
}) => {
  const Content = (
    <View className="flex-row justify-between items-center w-full">
      <View className="flex-row items-center flex-1">
        <View className="w-8 items-center mr-3">
          <Ionicons name={icon} size={22} color={theme.primary} />
        </View>
        <Text className="text-lg font-medium" style={{ color: theme.text }}>
          {label}
        </Text>
      </View>
      
      <View className="flex-row items-center">
        {typeof value === 'string' ? (
          <Text className="mr-2 text-base" style={{ color: theme.textSecondary || theme.text }}>
            {value}
          </Text>
        ) : (
          value
        )}
        
        {showChevron && (
          <Ionicons 
            name={isOpen ? "chevron-up" : "chevron-down"} 
            size={20} 
            color={theme.textSecondary || '#64748b'} 
          />
        )}
      </View>
    </View>
  );

  if (onPress) {
    return <TouchableOpacity onPress={onPress} activeOpacity={0.7}>{Content}</TouchableOpacity>;
  }
  return <View>{Content}</View>;
};