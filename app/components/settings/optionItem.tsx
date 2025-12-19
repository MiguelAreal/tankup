import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../interfaces/theme';

interface OptionItemProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
  theme: Theme;
  isLast?: boolean;
}

export const OptionItem: React.FC<OptionItemProps> = ({ 
  label, 
  isSelected, 
  onPress, 
  theme, 
  isLast 
}) => (
  <TouchableOpacity 
    className={`p-4 rounded-lg flex-row justify-between items-center ${!isLast ? 'mb-1' : ''}`}
    style={{ backgroundColor: isSelected ? (theme.primary + '15') : 'transparent' }} 
    onPress={onPress}
  >
    <Text 
      className="text-base font-medium"
      style={{ color: isSelected ? theme.primary : (theme.textSecondary || theme.text) }}
    >
      {label}
    </Text>
    {isSelected && <Ionicons name="checkmark" size={20} color={theme.primary} />}
  </TouchableOpacity>
);