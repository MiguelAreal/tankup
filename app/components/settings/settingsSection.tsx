import React from 'react';
import { View } from 'react-native';
import { Theme } from '../../interfaces/theme';

interface SettingsSectionProps {
  children: React.ReactNode;
  theme: Theme;
  className?: string;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({ children, theme, className }) => (
  <View 
    className={`rounded-xl p-4 mb-6 shadow-sm ${className || ''}`}
    style={{ 
      backgroundColor: theme.card,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2
    }}
  >
    {children}
  </View>
);