import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

const Header: React.FC = () => {
  const router = useRouter();
  return (
    <View className={`px-4 py-3 flex-row justify-between items-centershadow-sm`}>
      <View className="flex-row items-center">
        <Text className="text-2xl font-bold text-blue-600 dark:text-blue-400">
          TankUp
        </Text>
        <Ionicons name="car" size={24} color="#2563eb" style={{ marginLeft: 8 }} />
      </View>
      
      <View className="flex-row">
        <TouchableOpacity 
          className="mr-4 p-2"
          onPress={() => router.push('./favorites')}
        >
          <Ionicons name="heart" size={24} color="#2563eb" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          className="mr-4 p-2"
          onPress={() => router.push('./search')}
        >
          <Ionicons name="search" size={24} color="#2563eb" />
        </TouchableOpacity>

        <TouchableOpacity
          className="p-2"
          onPress={() => router.push('./settings')}
        >
          <Ionicons name="settings-outline" size={24} color="#2563eb" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Header;