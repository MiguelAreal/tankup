import { AdMobBanner } from 'expo-ads-admob';
import React from 'react';
import { Platform, View } from 'react-native';

interface AdBannerProps {
  testID?: string;
}

const AdBanner: React.FC<AdBannerProps> = ({ testID }) => {
  // AdMob IDs
  const bannerAdUnitID = __DEV__ 
    ? 'ca-app-pub-3940256099942544/6300978111' // Test ad unit ID
    : 'ca-app-pub-2077617628178689/9692584772'; // Your production banner ad unit ID

  // Don't render ads on web
  if (Platform.OS === 'web') {
    return null;
  }

  return (
    <View className="w-full items-center justify-center py-2">
      <AdMobBanner
        bannerSize="smartBannerPortrait"
        adUnitID={bannerAdUnitID}
        servePersonalizedAds={true}
        onDidFailToReceiveAdWithError={(error) => console.log(error)}
        testID={testID}
      />
    </View>
  );
};

export default React.memo(AdBanner); 