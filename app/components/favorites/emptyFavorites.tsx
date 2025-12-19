import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { Theme } from '../../interfaces/theme';

interface EmptyFavoritesProps {
  theme: Theme;
}

export const EmptyFavorites: React.FC<EmptyFavoritesProps> = ({ theme }) => {
  const { t } = useTranslation();

  return (
    <View className="flex-1 items-center justify-center p-8 mt-10">
      <View className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full mb-4">
        <Ionicons name="heart-outline" size={48} color={theme.textSecondary} />
      </View>
      <Text style={{ color: theme.text }} className="text-xl font-bold text-center mb-2">
        {t('favorites.emptyTitle')}
      </Text>
      <Text style={{ color: theme.textSecondary }} className="text-center text-base leading-6">
        {t('favorites.emptyMessage')}
      </Text>
    </View>
  );
};