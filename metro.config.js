// Learn more: https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// The Anthropic SDK's ESM build has circular re-exports that React Refresh reads before they
// initialise in dev ("Cannot access ... before initialization"). Its CommonJS build is safe.
const upstream = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const resolve = upstream ?? context.resolveRequest;
  if (moduleName === '@anthropic-ai/sdk' || moduleName.startsWith('@anthropic-ai/sdk/')) {
    return resolve(
      { ...context, unstable_conditionNames: ['require', 'react-native'] },
      moduleName,
      platform,
    );
  }
  return resolve(context, moduleName, platform);
};

module.exports = config;
