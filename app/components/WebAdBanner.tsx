import React, { useEffect } from 'react';
import { Platform, View } from 'react-native';

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface WebAdBannerProps {
  testID?: string;
}

const WebAdBanner: React.FC<WebAdBannerProps> = ({ testID }) => {
  useEffect(() => {
    // Only load AdSense on web platform
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        // Load AdSense script if not already loaded
        if (!window.adsbygoogle) {
          const script = document.createElement('script');
          script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
          script.async = true;
          script.crossOrigin = 'anonymous';
          document.head.appendChild(script);
        }

        // Initialize AdSense
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (error) {
        console.error('Error loading AdSense:', error);
      }
    }
  }, []);

  // Don't render on mobile
  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <View className="w-full items-center justify-center py-2">
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-2077617628178689" // Seu ID do AdSense
        data-ad-slot="YOUR_AD_SLOT_ID" // Você receberá este ID após aprovação
        data-ad-format="auto"
        data-full-width-responsive="true"
        data-testid={testID}
      />
    </View>
  );
};

export default React.memo(WebAdBanner); 