import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';

// Context & Types
import { FUEL_ICONS, SORT_ICONS } from '@/types/models/IconProps';
import { PostoSortOption, SORT_OPTIONS_LIST } from '@/types/models/PostoSortOption';
import { useAppContext } from '../context/AppContext';

type FuelTypeSelectorProps = {
  selectedFuelType: string;
  onFuelTypeChange: (fuelType: string) => void;
  selectedSort?: PostoSortOption;
  onSelectSort?: (sort: PostoSortOption) => void;
};

const FuelTypeSelector: React.FC<FuelTypeSelectorProps> = ({
  selectedFuelType,
  onFuelTypeChange,
  selectedSort = 'mais_barato',
  onSelectSort,
}) => {
  const { t } = useTranslation();
  const { selectedFuelTypes, theme, availableFuelTypes } = useAppContext();
  
  // Ref para controlar o ScrollView
  const scrollRef = useRef<ScrollView>(null);

  // Processamento da lista de combustíveis
  const displayFuelTypes = useMemo(() => {
    const sourceList = availableFuelTypes.length ? availableFuelTypes : selectedFuelTypes;
    
    return sourceList
      .filter((id) => selectedFuelTypes.includes(id))
      .map((id) => ({
        id,
        icon: FUEL_ICONS[id] || 'water'
      }));
  }, [availableFuelTypes, selectedFuelTypes]);

  // Validação: Garante que o tipo selecionado é válido
  useEffect(() => {
    if (selectedFuelTypes.length > 0 && !selectedFuelTypes.includes(selectedFuelType)) {
      onFuelTypeChange(selectedFuelTypes[0]);
    }
  }, [selectedFuelTypes, selectedFuelType, onFuelTypeChange]);

  // Lógica específica para WEB: Transformar roda do rato vertical em scroll horizontal
  useEffect(() => {
    if (Platform.OS === 'web' && scrollRef.current) {
      const scrollableNode = (scrollRef.current as any).getScrollableNode();
      
      if (scrollableNode) {
        const onWheel = (e: WheelEvent) => {
          if (e.deltaY === 0) return;
          e.preventDefault();
          scrollableNode.scrollLeft += e.deltaY;
        };

        scrollableNode.addEventListener('wheel', onWheel, { passive: false });

        return () => {
          scrollableNode.removeEventListener('wheel', onWheel);
        };
      }
    }
  }, []);

  // Ciclo de ordenação
  const handleSortPress = () => {
    if (!onSelectSort) return;
    
    const currentIndex = SORT_OPTIONS_LIST.indexOf(selectedSort);
    const nextIndex = (currentIndex + 1) % SORT_OPTIONS_LIST.length;
    
    onSelectSort(SORT_OPTIONS_LIST[nextIndex]);
  };

  return (
    <View 
      style={{ backgroundColor: theme.background, borderBottomWidth: 1, borderBottomColor: theme.border }} 
      className="flex-row items-center py-2"
    >
      
      {/* 1. Botão de Ordenar (Fixo à esquerda) */}
      {onSelectSort && (
        <View style={{ paddingLeft: 16, paddingRight: 8 }}>
            <TouchableOpacity
            onPress={handleSortPress}
            style={{ 
                backgroundColor: theme.card,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2
            }}
            className="items-center justify-center w-10 h-10 rounded-full"
            accessibilityLabel={t(`station.sortBy.${selectedSort}`)}
            >
            <Ionicons
                name={SORT_ICONS[selectedSort]}
                size={20}
                color={theme.primary}
            />
            </TouchableOpacity>
        </View>
      )}

      {/* 2. Divisor Visual */}
      <View style={{ width: 1, height: 24, backgroundColor: theme.border, marginRight: 8 }} />

      {/* 3. Lista de Combustíveis (Scroll Horizontal) */}
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        className="flex-1"
        style={{ flex: 1, width: '100%' }} 
        contentContainerStyle={{ 
            paddingRight: 16, 
            alignItems: 'center' 
        }}
      >
        {displayFuelTypes.map((type) => {
          const isSelected = selectedFuelType === type.id;
          return (
            <TouchableOpacity
              key={type.id}
              style={{
                backgroundColor: isSelected ? theme.primary : theme.card,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 1,
                elevation: 1
              }}
              className="mr-3 py-2 px-4 rounded-full flex-row items-center"
              onPress={() => onFuelTypeChange(type.id)}
            >
              <Ionicons
                name={type.icon}
                size={16}
                color={isSelected ? '#ffffff' : theme.textSecondary}
              />
              <Text
                style={{ color: isSelected ? '#ffffff' : theme.text }}
                className="ml-2 font-medium text-xs"
              >
                {t(`station.fuelType.${type.id}`, { defaultValue: type.id })}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default FuelTypeSelector;