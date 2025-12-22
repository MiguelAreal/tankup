import { Ionicons } from "@expo/vector-icons";
import { PostoSortOption } from "./PostoSortOption";

const SORT_ICONS: Record<PostoSortOption, keyof typeof Ionicons.glyphMap> = {
  'mais_barato': 'trending-down',
  'mais_caro': 'trending-up',
  'mais_perto': 'location',
  'mais_longe': 'location-outline',
};


const FUEL_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'Gasóleo simples': 'water',
  'Gasóleo especial': 'water-outline',
  'Gasolina simples 95': 'speedometer',
  'Gasolina especial 95': 'speedometer-outline',
  'Gasolina 98': 'flame',
  'Gasolina especial 98': 'flame-outline',
  'Biodiesel B15': 'flash',
  'GPL Auto': 'flash-outline',
};

export { FUEL_ICONS, SORT_ICONS };
