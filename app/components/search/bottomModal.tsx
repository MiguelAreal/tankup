import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface BottomModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const BottomModal: React.FC<BottomModalProps> = ({ 
  visible, 
  onClose, 
  title, 
  children 
}) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View className="flex-1 bg-black/50 justify-end">
      <View className="bg-white dark:bg-slate-800 rounded-t-xl p-4 max-h-[70%]">
        <View className="flex-row justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-700 pb-2">
          <Text className="text-xl font-bold text-slate-800 dark:text-slate-200">{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#64748b" />
          </TouchableOpacity>
        </View>
        <ScrollView>{children}</ScrollView>
      </View>
    </View>
  </Modal>
);