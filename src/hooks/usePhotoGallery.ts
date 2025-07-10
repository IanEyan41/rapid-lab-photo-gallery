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

// Direct import for Geolocation to ensure it's properly loaded
import { Geolocation } from "@capacitor/geolocation";

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

    const savedPhoto = {
      filepath: isPlatform("hybrid") ? savedFile.uri : fileName,
      webviewPath: isPlatform("hybrid")
        ? Capacitor.convertFileSrc(savedFile.uri)
        : photo.webPath,
      location: locationData
        ? {
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            timestamp: Date.now(),
          }
        : undefined,
    };

    console.log("Saved photo with location:", savedPhoto.location);
    return savedPhoto;
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
      console.log("Loaded photos:", photosInPreferences);
      console.log(
        "Photos with location:",
        photosInPreferences.filter((p) => p.location)
      );
      setPhotos(photosInPreferences);
    };
    loadSaved();
  }, []);

  const getCurrentPosition = async () => {
    try {
      console.log("Getting current position...");

      // Check if geolocation is available
      if (!Capacitor.isPluginAvailable("Geolocation")) {
        console.error("Geolocation is not available");
        return null;
      }

      // Request permissions first
      const permissionStatus = await Geolocation.checkPermissions();
      console.log("Geolocation permission status:", permissionStatus.location);

      if (permissionStatus.location !== "granted") {
        const requestResult = await Geolocation.requestPermissions();
        console.log("Requested permission result:", requestResult.location);
        if (requestResult.location !== "granted") {
          console.error("Location permission not granted");
          return null;
        }
      }

      // Get current position with high accuracy
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });

      console.log("Got position:", position.coords);
      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
    } catch (error) {
      console.error("Error getting location:", error);
      return null;
    }
  };

  const takePhoto = async () => {
    try {
      // Request location permission first, before taking photo
      if (Capacitor.isPluginAvailable("Geolocation")) {
        console.log("Requesting location permission...");
        const permissionStatus = await Geolocation.requestPermissions();
        console.log("Location permission response:", permissionStatus.location);
      }

      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        quality: 100,
      });

      console.log("Photo taken successfully");

      // Try to get location when taking a photo
      const locationData = await getCurrentPosition();
      console.log("Location data for photo:", locationData);

      const fileName = Date.now() + ".jpeg";
      const savedFileImage = await savePicture(photo, fileName, locationData);

      const newPhotos = [savedFileImage, ...photos];
      setPhotos(newPhotos);
      await Preferences.set({
        key: PHOTO_STORAGE,
        value: JSON.stringify(newPhotos),
      });
      console.log("Photo saved with location");
    } catch (error) {
      console.error("Error taking photo:", error);
    }
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
