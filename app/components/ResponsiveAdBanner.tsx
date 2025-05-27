import React from 'react';
import { Platform } from 'react-native';
import AdBanner from './AdBanner';
import WebAdBanner from './WebAdBanner';

interface ResponsiveAdBannerProps {
  testID?: string;
}

const ResponsiveAdBanner: React.FC<ResponsiveAdBannerProps> = (props) => {
  // Use AdMob for mobile, AdSense for web
  return Platform.OS === 'web' ? (
    <WebAdBanner {...props} />
  ) : (
    <AdBanner {...props} />
  );
};

export default React.memo(ResponsiveAdBanner); 