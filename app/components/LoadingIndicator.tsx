import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

type LoadingIndicatorProps = {
  message?: string;
};

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ message }) => (
  <View className="flex-1 items-center justify-center">
    <ActivityIndicator size="large" color="#2563eb" />
    {message && (
      <Text className="mt-4 text-slate-600 dark:text-slate-400">{message}</Text>
    )}
  </View>
);

export default LoadingIndicator;