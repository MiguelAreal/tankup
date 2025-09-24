import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useAppContext } from '../context/AppContext';

const Header: React.FC = () => {
  const router = useRouter();
  const { theme } = useAppContext();

  return (
    <View style={{ 
      backgroundColor: theme.background,
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ 
          fontSize: 24,
          fontWeight: 'bold',
          color: theme.text
        }}>
          TankUp
        </Text>
        <Ionicons name="car" size={24} color={theme.primary} style={{ marginLeft: 8 }} />
      </View>
      
      <View style={{ flexDirection: 'row' }}>
        <TouchableOpacity 
          style={{ 
            marginRight: 16,
            padding: 8
          }}
          onPress={() => router.push('./favorites')}
        >
          <Ionicons name="heart" size={24} color={theme.primary} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={{ 
            marginRight: 16,
            padding: 8
          }}
          onPress={() => router.push('./search')}
        >
          <Ionicons name="search" size={24} color={theme.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={{ padding: 8 }}
          onPress={() => router.push('./settings')}
        >
          <Ionicons name="settings-outline" size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Header;