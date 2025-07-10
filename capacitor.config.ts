import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "io.ionic.starter",
  appName: "photo-gallery",
  webDir: "dist",
  plugins: {
    Geolocation: {
      // Android config
      androidPermissions: {
        permissions: [
          "android.permission.ACCESS_COARSE_LOCATION",
          "android.permission.ACCESS_FINE_LOCATION",
        ],
      },
      // iOS config
      ios: {
        plistEntries: [
          {
            key: "NSLocationWhenInUseUsageDescription",
            string:
              "We need access to your location to show where photos were taken.",
          },
          {
            key: "NSLocationAlwaysUsageDescription",
            string:
              "We need access to your location to show where photos were taken.",
          },
        ],
      },
    },
  },
};

export default config;
