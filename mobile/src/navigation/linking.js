import * as Linking from 'expo-linking'

export default {
  prefixes: [Linking.createURL('/')],
  config: {
    screens: {
      Login: 'login',
      Main: {
        screens: {
          Home: 'home',
          Map: 'map',
          Zones: 'zones',
          Alerts: 'alerts',
          Settings: 'settings',
        },
      },
      ZoneDetails: 'zone/:zoneId',
    },
  },
}
