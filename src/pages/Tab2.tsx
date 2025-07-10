import React, { useState } from "react";
import {
  IonContent,
  ScrollDetail,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonFab,
  IonFabButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonImg,
  IonActionSheet,
  IonToast,
  IonCard,
  IonCardContent,
  IonButton,
  IonText,
} from "@ionic/react";
import { camera, trash, close, location } from "ionicons/icons";
import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";
import { usePhotoGallery, UserPhoto } from "../hooks/usePhotoGallery";
import "./Tab2.css";

const Tab2: React.FC = () => {
  const { photos, takePhoto, deletePhoto } = usePhotoGallery();
  const [photoToDelete, setPhotoToDelete] = useState<UserPhoto>();
  const [showToast, setShowToast] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");

  function handleScrollStart() {
    console.log("scroll start");
  }

  function handleScroll(event: CustomEvent<ScrollDetail>) {
    console.log("scroll", JSON.stringify(event.detail));
  }

  function handleScrollEnd() {
    console.log("scroll end");
  }

  // Function to request location permission explicitly
  const requestLocationPermission = async () => {
    try {
      console.log(
        "Checking Capacitor plugins:",
        Capacitor.getPlatform(),
        Capacitor.isNativePlatform()
      );

      // Check if we're on a native platform
      if (!Capacitor.isNativePlatform()) {
        setLocationMessage(
          "You need to run this app on a real device for location to work."
        );
        return;
      }

      // Always try to use Geolocation regardless of isPluginAvailable
      // which sometimes returns false even when it's available
      try {
        console.log("Requesting location permission explicitly...");
        const permissionStatus = await Geolocation.checkPermissions();
        console.log("Current permission status:", permissionStatus.location);

        const requestResult = await Geolocation.requestPermissions();
        const result = requestResult.location;
        console.log("Location permission response:", result);

        if (result === "granted") {
          setLocationEnabled(true);
          setLocationMessage(
            "Location permission granted! Your photos will include location data."
          );

          // Try to get the current position to make sure it works
          try {
            const position = await Geolocation.getCurrentPosition({
              enableHighAccuracy: true,
              timeout: 15000,
            });
            console.log("Current position:", position);
            setLocationMessage(
              `Location works! Current coordinates: ${position.coords.latitude.toFixed(
                4
              )}, ${position.coords.longitude.toFixed(4)}`
            );
          } catch (posError) {
            console.error("Error getting position:", posError);
            setLocationMessage(
              "Permission granted, but failed to get current position. Make sure location services are enabled."
            );
          }
        } else {
          setLocationEnabled(false);
          setLocationMessage(
            "Location permission denied. Photos will not have location data."
          );
        }
      } catch (error) {
        console.error("Error with Geolocation plugin:", error);
        setLocationMessage(
          "Error using Geolocation. Please check app permissions in device settings."
        );
      }
    } catch (error) {
      console.error("Error requesting location permission:", error);
      setLocationMessage(
        "Error requesting location permission. Try again or check settings."
      );
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Photo Gallery</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent
        fullscreen
        scrollEvents={true}
        onIonScrollStart={handleScrollStart}
        onIonScroll={handleScroll}
        onIonScrollEnd={handleScrollEnd}
        class="ion-padding"
      >
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Photos</IonTitle>
          </IonToolbar>
        </IonHeader>

        {/* Location Permission Card */}
        <IonCard className="location-card">
          <IonCardContent>
            <h2>
              <IonIcon icon={location} /> Location for Photos
            </h2>
            <p>
              Enable location to add location data to your photos. This will
              allow them to appear on the map.
            </p>
            <IonButton
              expand="block"
              color={locationEnabled ? "success" : "primary"}
              onClick={requestLocationPermission}
            >
              {locationEnabled ? "Location Enabled" : "Enable Location"}
            </IonButton>
            {locationMessage && (
              <IonText color={locationEnabled ? "success" : "danger"}>
                <p className="location-message">{locationMessage}</p>
              </IonText>
            )}
          </IonCardContent>
        </IonCard>

        <IonGrid>
          <IonRow>
            {photos.map((photo, index) => (
              <IonCol size="6" key={photo.filepath}>
                <IonImg
                  className="rounded-photo"
                  onClick={() => setPhotoToDelete(photo)}
                  src={photo.webviewPath}
                />
              </IonCol>
            ))}
          </IonRow>
        </IonGrid>
        <IonFab vertical="bottom" horizontal="center" slot="fixed">
          <IonFabButton
            onClick={async () => {
              await takePhoto();
              setShowToast(true);
            }}
          >
            <IonIcon icon={camera}></IonIcon>
          </IonFabButton>
        </IonFab>
        {/* <ExploreContainer name="Tab 2 page" /> */}
        <IonActionSheet
          isOpen={!!photoToDelete}
          buttons={[
            {
              text: "Delete",
              role: "destructive",
              icon: trash,
              handler: () => {
                if (photoToDelete) {
                  deletePhoto(photoToDelete);
                  setPhotoToDelete(undefined);
                }
              },
            },
            {
              text: "Cancel",
              icon: close,
              role: "cancel",
            },
          ]}
          onDidDismiss={() => setPhotoToDelete(undefined)}
        />
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message="Photo taken successfully!"
          duration={1500}
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default Tab2;
