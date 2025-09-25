import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppContext } from '../context/AppContext';

type StatusType = 'error' | 'warning' | 'info' | 'success';
type IconName = 'alert-circle' | 'warning' | 'information-circle' | 'checkmark-circle' | 'close';

interface StatusMessageProps {
  message: string;
  type?: StatusType;
  icon?: IconName;
  onClose?: () => void;
}

const StatusMessage: React.FC<StatusMessageProps> = ({ 
  message, 
  type = 'error',
  icon,
  onClose
}) => {
  const { theme, darkMode } = useAppContext();

  const getIconName = (): IconName => {
    if (icon) return icon;
    switch (type) {
      case 'error':
        return 'alert-circle';
      case 'warning':
        return 'warning';
      case 'info':
        return 'information-circle';
      case 'success':
        return 'checkmark-circle';
      default:
        return 'alert-circle';
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'error':
        return darkMode ? '#7f1d1d' : '#fee2e2';
      case 'warning':
        return darkMode ? '#78350f' : '#fef3c7';
      case 'info':
        return darkMode ? '#1e3a8a' : '#dbeafe';
      case 'success':
        return darkMode ? '#14532d' : '#dcfce7';
      default:
        return darkMode ? '#7f1d1d' : '#fee2e2';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'error':
        return darkMode ? '#fecaca' : '#dc2626';
      case 'warning':
        return darkMode ? '#fcd34d' : '#d97706';
      case 'info':
        return darkMode ? '#93c5fd' : '#2563eb';
      case 'success':
        return darkMode ? '#86efac' : '#16a34a';
      default:
        return darkMode ? '#fecaca' : '#dc2626';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: getBackgroundColor() }]}>
      <Ionicons 
        name={getIconName()} 
        size={24} 
        color={getTextColor()} 
        style={styles.icon}
      />
      <Text style={[styles.message, { color: getTextColor() }]}>
        {message}
      </Text>
      {onClose && (
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons 
            name="close" 
            size={20} 
            color={getTextColor()} 
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    marginHorizontal: 16,
  },
  icon: {
    marginRight: 12,
  },
  message: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  closeButton: {
    marginLeft: 12,
  },
});

export default StatusMessage; 