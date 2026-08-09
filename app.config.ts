import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const googleMapsApiKey =
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    '';

  const rawPlugins = config.plugins || [];
  const plugins = rawPlugins.map((plugin): string | [string, any] => {
    if (plugin === 'react-native-maps') {
      return ['react-native-maps', { androidGoogleMapsApiKey: googleMapsApiKey }];
    }
    if (Array.isArray(plugin) && plugin[0] === 'react-native-maps') {
      return [
        'react-native-maps',
        { ...(plugin[1] || {}), androidGoogleMapsApiKey: googleMapsApiKey },
      ];
    }
    return plugin as string | [string, any];
  });

  return {
    ...config,
    name: config.name || 'homesafe',
    slug: config.slug || 'homesafe',
    plugins,
    android: {
      ...config.android,
      config: {
        ...config.android?.config,
        googleMaps: {
          apiKey: googleMapsApiKey,
        },
      },
    },
  };
};
