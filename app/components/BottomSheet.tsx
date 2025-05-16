import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
};

const { height } = Dimensions.get('window');

const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  title = '',
  children,
}) => {
  const translateY = useRef(new Animated.Value(height)).current;
  
  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 5,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [translateY, visible]);
  
  if (!visible) return null;
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View className="flex-1">
        {/* Backdrop blur */}
        <BlurView
          intensity={30}
          className="absolute inset-0"
          tint="dark"
        >
          <TouchableOpacity
            className="flex-1"
            activeOpacity={1}
            onPress={onClose}
          />
        </BlurView>

        {/* Bottom Sheet */}
        <Animated.View
          className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-3xl shadow-lg"
          style={[
            {
              transform: [{ translateY }],
              maxHeight: height * 0.8,
            },
          ]}
        >
          {/* Handle and Title */}
          <View className="px-4 pt-3 pb-2 border-b border-slate-200 dark:border-slate-800">
            <View className="w-16 h-1 bg-slate-300 dark:bg-slate-700 rounded-full self-center mb-2" />
            
            <View className="flex-row justify-between items-center">
              <Text className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                {title}
              </Text>
              
              <TouchableOpacity onPress={onClose} className="p-2">
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Content */}
          <ScrollView className="flex-1">{children}</ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default BottomSheet;