import { useState, useEffect } from "react";
import { isPlatform } from "@ionic/react";

import {
  Camera,
  CameraResultType,
  CameraSource,
  Photo,
} from "@capacitor/camera";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Preferences } from "@capacitor/preferences";
import { Capacitor } from "@capacitor/core";

// Handle Geolocation dynamically to avoid build errors if package isn't available
let Geolocation: any = null;
const initGeolocation = async () => {
  try {
    // Dynamic import to handle missing package gracefully
    if (window) {
      // Only try to use Geolocation if it's available in Capacitor
      if (Capacitor.isPluginAvailable("Geolocation")) {
        const GeolocationPlugin = await import("@capacitor/geolocation");
        Geolocation = GeolocationPlugin.Geolocation;
      }
    }
  } catch (error) {
    console.error("Geolocation not available", error);
  }
};

// Initialize geolocation
initGeolocation();

export interface UserPhoto {
  filepath: string;
  webviewPath?: string;
  location?: {
    latitude: number;
    longitude: number;
    timestamp: number;
  };
}

const PHOTO_STORAGE = "photos";

export function usePhotoGallery() {
  const savePicture = async (
    photo: Photo,
    fileName: string,
    locationData?: { latitude: number; longitude: number } | null
  ): Promise<UserPhoto> => {
    let base64Data: string | Blob;
    // "hybrid" will detect Cordova or Capacitor;
    if (isPlatform("hybrid")) {
      const file = await Filesystem.readFile({
        path: photo.path!,
      });
      base64Data = file.data;
    } else {
      base64Data = await base64FromPath(photo.webPath!);
    }
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data,
    });

    if (isPlatform("hybrid")) {
      // Display the new image by rewriting the 'file://' path to HTTP
      // Details: https://ionicframework.com/docs/building/webview#file-protocol
      return {
        filepath: savedFile.uri,
        webviewPath: Capacitor.convertFileSrc(savedFile.uri),
        location: locationData
          ? {
              latitude: locationData.latitude,
              longitude: locationData.longitude,
              timestamp: Date.now(),
            }
          : undefined,
      };
    } else {
      // Use webPath to display the new image instead of base64 since it's
      // already loaded into memory
      return {
        filepath: fileName,
        webviewPath: photo.webPath,
        location: locationData
          ? {
              latitude: locationData.latitude,
              longitude: locationData.longitude,
              timestamp: Date.now(),
            }
          : undefined,
      };
    }
  };
  const [photos, setPhotos] = useState<UserPhoto[]>([]);
  useEffect(() => {
    const loadSaved = async () => {
      const { value } = await Preferences.get({ key: PHOTO_STORAGE });

      const photosInPreferences = (
        value ? JSON.parse(value) : []
      ) as UserPhoto[];
      // If running on the web...
      if (!isPlatform("hybrid")) {
        for (let photo of photosInPreferences) {
          const file = await Filesystem.readFile({
            path: photo.filepath,
            directory: Directory.Data,
          });
          // Web platform only: Load the photo as base64 data
          photo.webviewPath = `data:image/jpeg;base64,${file.data}`;
        }
      }
      setPhotos(photosInPreferences);
    };
    loadSaved();
  }, []);

  const getCurrentPosition = async () => {
    if (!Geolocation) {
      await initGeolocation();
      if (!Geolocation) return null;
    }

    try {
      const position = await Geolocation.getCurrentPosition();
      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
    } catch (error) {
      console.error("Error getting location", error);
      return null;
    }
  };

  const takePhoto = async () => {
    const photo = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      quality: 100,
    });

    // Try to get location when taking a photo
    const locationData = await getCurrentPosition();

    const fileName = Date.now() + ".jpeg";
    const savedFileImage = await savePicture(photo, fileName, locationData);

    const newPhotos = [savedFileImage, ...photos];
    setPhotos(newPhotos);
    Preferences.set({ key: PHOTO_STORAGE, value: JSON.stringify(newPhotos) });
  };

  const deletePhoto = async (photo: UserPhoto) => {
    // Remove this photo from the Photos reference data array
    const newPhotos = photos.filter((p) => p.filepath !== photo.filepath);

    // Update photos array cache by overwriting the existing photo array
    Preferences.set({ key: PHOTO_STORAGE, value: JSON.stringify(newPhotos) });

    // delete photo file from filesystem
    const filename = photo.filepath.substr(photo.filepath.lastIndexOf("/") + 1);
    await Filesystem.deleteFile({
      path: filename,
      directory: Directory.Data,
    });
    setPhotos(newPhotos);
  };

  return {
    photos,
    takePhoto,
    deletePhoto,
  };
}

export async function base64FromPath(path: string): Promise<string> {
  const response = await fetch(path);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject("method did not return a string");
      }
    };
    reader.readAsDataURL(blob);
  });
}
