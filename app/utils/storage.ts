import AsyncStorage from '@react-native-async-storage/async-storage';
import { Posto } from '../../types/models';

const FAVORITES_KEY = '@tankup_favorites';

export const getItem = async (key: string): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    return null;
  }
};

export const setItem = async (key: string, value: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    // Silent error handling
  }
};

export const removeItem = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    // Silent error handling
  }
};

export const saveFavorite = async (station: Posto): Promise<void> => {
  try {
    const existingFavorites = await getFavorites();
    const updatedFavorites = [...existingFavorites, station];
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));
  } catch (error) {
    throw error;
  }
};

export const removeFavorite = async (stationId: string): Promise<void> => {
  try {
    const existingFavorites = await getFavorites();
    const updatedFavorites = existingFavorites.filter(station => station.id !== stationId);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));
  } catch (error) {
    throw error;
  }
};

export const getFavorites = async (): Promise<Posto[]> => {
  try {
    const favorites = await AsyncStorage.getItem(FAVORITES_KEY);
    return favorites ? JSON.parse(favorites) : [];
  } catch (error) {
    return [];
  }
};

export const isFavorite = async (stationId: string): Promise<boolean> => {
  try {
    const favorites = await getFavorites();
    return favorites.some(station => station.id === stationId);
  } catch (error) {
    return false;
  }
};

const storageUtils = {
  getItem,
  setItem,
  removeItem,
};

export default storageUtils;
