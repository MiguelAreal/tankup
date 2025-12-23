import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Compara duas versões semânticas (ex: "1.0.0" vs "1.0.5")
 * Retorna: 1 (v1 > v2), -1 (v1 < v2), 0 (iguais)
 */
export const compareVersions = (v1: string, v2: string): number => {
  const v1Parts = v1.split('.').map(Number);
  const v2Parts = v2.split('.').map(Number);

  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const val1 = v1Parts[i] || 0;
    const val2 = v2Parts[i] || 0;

    if (val1 > val2) return 1;
    if (val1 < val2) return -1;
  }
  return 0;
};

export const getCurrentVersion = () => {
  // Tenta obter a versão de várias fontes para garantir compatibilidade Web/Native
  return (
    Constants.expoConfig?.version || 
    Constants.manifest2?.extra?.expoClient?.version || 
    "1.0.0"
  );
};

export const getCurrentPlatform = (): 'android' | 'ios' | 'web' => {
  if (Platform.OS === 'web') {
    return 'web';
  }
  return Platform.OS === 'ios' ? 'ios' : 'android';
};