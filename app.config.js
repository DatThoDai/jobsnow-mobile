/** Ensures `extra` (OAuth keys, API URL) is available via Constants.expoConfig.extra */
const appJson = require('./app.json');

const { eas, ...extraWithoutEas } = appJson.expo.extra ?? {};

module.exports = {
  expo: {
    ...appJson.expo,
    extra: {
      ...extraWithoutEas,
      eas,
    },
    plugins: [
      '@react-native-google-signin/google-signin',
    ],
  },
};
