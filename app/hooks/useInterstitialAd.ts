import { AdMobInterstitial } from 'expo-ads-admob';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

const COOLDOWN_PERIOD = 60000; // 1 minute in milliseconds

export const useInterstitialAd = () => {
  const [isReady, setIsReady] = useState(false);
  const lastShownTime = useRef<number>(0);

  // AdMob IDs
  const interstitialAdUnitID = __DEV__
    ? 'ca-app-pub-3940256099942544/1033173712' // Test ad unit ID
    : 'ca-app-pub-2077617628178689/9229550340'; // Your production interstitial ad unit ID

  useEffect(() => {
    // Don't initialize ads on web
    if (Platform.OS === 'web') {
      return;
    }

    loadAd();

    return () => {
      AdMobInterstitial.removeAllListeners();
    };
  }, []);

  const loadAd = async () => {
    // Don't load ads on web
    if (Platform.OS === 'web') {
      return;
    }

    try {
      await AdMobInterstitial.setAdUnitID(interstitialAdUnitID);
      await AdMobInterstitial.requestAdAsync();
      setIsReady(true);
    } catch (error) {
      console.log('Error loading interstitial ad:', error);
      setIsReady(false);
    }
  };

  const showAd = async () => {
    // Don't show ads on web
    if (Platform.OS === 'web') {
      return false;
    }

    const now = Date.now();
    if (!isReady || now - lastShownTime.current < COOLDOWN_PERIOD) {
      return false;
    }

    try {
      await AdMobInterstitial.showAdAsync();
      lastShownTime.current = now;
      setIsReady(false);
      loadAd(); // Load the next ad
      return true;
    } catch (error) {
      console.log('Error showing interstitial ad:', error);
      return false;
    }
  };

  return { showAd, isReady };
}; 