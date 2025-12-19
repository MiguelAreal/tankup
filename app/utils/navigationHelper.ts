// src/utils/navigationHelper.ts
import { Linking } from 'react-native';

type NavigationApp = 'google_maps' | 'waze' | 'apple_maps';

export const openNavigationApp = async (
  latitude: number, 
  longitude: number, 
  app: NavigationApp
) => {
  if (!latitude || !longitude) return;

  let url = '';

  switch (app) {
    case 'waze':
      url = `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;
      break;
    case 'apple_maps':
      url = `maps://app?daddr=${latitude},${longitude}`;
      break;
    case 'google_maps':
    default:
      url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
      break;
  }

  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      // Fallback inteligente
      const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
      await Linking.openURL(fallbackUrl);
    }
  } catch (error) {
    console.error('Failed to open navigation app:', error);
  }
};