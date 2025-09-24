// Temporarily disabled
// import React from 'react';
// import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
// import { useAppContext } from '../../context/AppContext';

// const AdBanner: React.FC = () => {
//   const { adUnitId } = useAppContext();
  
//   return (
//     <BannerAd
//       unitId={adUnitId || TestIds.BANNER}
//       size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
//       requestOptions={{
//         requestNonPersonalizedAdsOnly: true,
//       }}
//     />
//   );
// };

// export default React.memo(AdBanner); 

// Temporary placeholder
import React from 'react';
import { View } from 'react-native';

const AdBanner: React.FC = () => {
  return <View />; // Empty view as placeholder
};

export default React.memo(AdBanner); 