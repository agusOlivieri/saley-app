export default {
  "expo": {
    "name": "saley-app",
    "slug": "saley-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/saley_icon.jpg",
    "userInterfaceStyle": "light",
    "scheme": "saley-app",
    "ios": {
      "supportsTablet": true
    },
    "android": {
      "predictiveBackGestureEnabled": false,
      "permissions": [
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.POST_NOTIFICATIONS"
      ],
      "package": "com.anonymous.saleyapp"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-router",
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Saley necesita acceso a tu ubicación para mostrarte ofertas cercanas."
        }
      ],
      [
        "@rnmapbox/maps",
        {
          "RNMapboxMapsImpl": "mapbox"
        }
      ],
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#003366",
          "defaultChannel": "default",
          "sounds": []
        }
      ],
      "expo-status-bar"
    ]
  }
}
