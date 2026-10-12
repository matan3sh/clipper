const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// inlineRem 16 keeps Tailwind spacing 1:1 with the design's px values (p-4 = 16px)
module.exports = withNativeWind(config, { input: './src/global.css', inlineRem: 16 });
