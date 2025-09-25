import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useAppContext } from '../context/AppContext';

type LoadingIndicatorProps = {
  message?: string;
};

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ message }) => {
  const { theme } = useAppContext();
  
  return (
    <View style={{ backgroundColor: theme.background }} className="flex-1 items-center justify-center">
      <ActivityIndicator size="large" color={theme.primary} />
      {message && (
        <Text style={{ color: theme.textSecondary }} className="mt-4">
          {message}
        </Text>
      )}
    </View>
  );
};

export default LoadingIndicator;