const { getDefaultConfig } = require("expo/metro-config");

const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname)

// Add platform-specific module resolution
config.resolver.sourceExts = process.env.RN_SRC_EXT
  ? [...process.env.RN_SRC_EXT.split(','), ...config.resolver.sourceExts]
  : config.resolver.sourceExts;

// Add platform-specific extensions
config.resolver.sourceExts = ['web.js', 'web.jsx', 'web.ts', 'web.tsx', ...config.resolver.sourceExts];

// Initialize blockList as an array
config.resolver.blockList = [
  /react-native-maps\/.*\.web\.(js|jsx|ts|tsx)$/,
  /react-native\/.*\.web\.(js|jsx|ts|tsx)$/,
];

// Add platform-specific resolver
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    // Skip native modules on web
    if (moduleName.includes('react-native-maps') || moduleName.includes('react-native/Libraries')) {
      return {
        type: 'empty',
      };
    }
  }
  return context.resolveRequest(context, moduleName, platform);
  
};

// Add source map configuration
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_classnames: true,
    keep_fnames: true,
    mangle: {
      keep_classnames: true,
      keep_fnames: true,
    },
  },
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

module.exports = withNativeWind(config, { input: './global.css' })