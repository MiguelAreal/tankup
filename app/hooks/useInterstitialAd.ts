// Temporarily disabled
// import { useEffect, useState } from 'react';
// import { AdEventType, InterstitialAd, TestIds } from 'react-native-google-mobile-ads';
// import { useAppContext } from '../../context/AppContext';

// export const useInterstitialAd = () => {
//   const [isAdLoaded, setIsAdLoaded] = useState(false);
//   const { adUnitId } = useAppContext();

//   const interstitial = InterstitialAd.createForAdRequest(
//     adUnitId || TestIds.INTERSTITIAL,
//     {
//       requestNonPersonalizedAdsOnly: true,
//     }
//   );

//   useEffect(() => {
//     const unsubscribeLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
//       setIsAdLoaded(true);
//     });

//     const unsubscribeClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
//       setIsAdLoaded(false);
//       interstitial.load();
//     });

//     // Start loading the interstitial straight away
//     interstitial.load();

//     // Unsubscribe from events on unmount
//     return () => {
//       unsubscribeLoaded();
//       unsubscribeClosed();
//     };
//   }, [interstitial]);

//   const showAd = async () => {
//     if (isAdLoaded) {
//       await interstitial.show();
//     }
//   };

//   return { showAd, isAdLoaded };
// };

// export default useInterstitialAd;

// Temporary placeholder implementation
export const useInterstitialAd = () => {
  return {
    showAd: async () => {},
    isAdLoaded: false
  };
};

export default useInterstitialAd; 