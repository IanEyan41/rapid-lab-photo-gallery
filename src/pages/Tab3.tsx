import React, { useState, useCallback } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonSpinner,
  IonModal,
  IonImg,
  IonButton,
  IonIcon,
  IonButtons,
  isPlatform,
} from "@ionic/react";
import { close } from "ionicons/icons";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";
import { usePhotoGallery, UserPhoto } from "../hooks/usePhotoGallery";
import "./Tab3.css";

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = {
  lat: 3.139, // Default to Malaysia
  lng: 101.6869,
};

const Tab3: React.FC = () => {
  const { photos } = usePhotoGallery();
  const [selectedPhoto, setSelectedPhoto] = useState<UserPhoto | null>(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [isInfoWindowOpen, setIsInfoWindowOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyD3ZX9bd0NXO31uiT2GYZklqezHy9Ckrb4",
    id: "google-map-script",
  });

  // Filter photos that have location data
  const photosWithLocation = photos.filter(
    (photo) =>
      photo.location && photo.location.latitude && photo.location.longitude
  );

  // Handle map load
  const onMapLoad = useCallback(() => {
    console.log("Map loaded successfully");
    if (photosWithLocation.length > 0 && photosWithLocation[0].location) {
      setMapCenter({
        lat: photosWithLocation[0].location.latitude,
        lng: photosWithLocation[0].location.longitude,
      });
    }
  }, [photosWithLocation]);

  // Handle marker click
  const handleMarkerClick = (photo: UserPhoto) => {
    setSelectedPhoto(photo);
    setIsInfoWindowOpen(true);
  };

  // Open modal with full photo
  const openPhotoModal = () => {
    setIsModalOpen(true);
  };

  if (loadError) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Photo Map</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="map-error">
            <p>Error loading Google Maps</p>
            <p>{loadError.message}</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!isLoaded) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Photo Map</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="map-loading">
            <IonSpinner />
            <p>Loading Maps...</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Photo Map</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Photo Map</IonTitle>
          </IonToolbar>
        </IonHeader>

        {/* Google Maps container */}
        <div className="map-container">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={mapCenter}
            zoom={10}
            onLoad={onMapLoad}
            options={{
              fullscreenControl: true,
              streetViewControl: true,
              mapTypeControl: true,
            }}
          >
            {photosWithLocation.map((photo) => (
              <Marker
                key={photo.filepath}
                position={{
                  lat: photo.location!.latitude,
                  lng: photo.location!.longitude,
                }}
                onClick={() => handleMarkerClick(photo)}
              />
            ))}

            {selectedPhoto && isInfoWindowOpen && (
              <InfoWindow
                position={{
                  lat: selectedPhoto.location!.latitude,
                  lng: selectedPhoto.location!.longitude,
                }}
                onCloseClick={() => setIsInfoWindowOpen(false)}
              >
                <div className="info-window-content">
                  <IonImg
                    src={selectedPhoto.webviewPath}
                    className="info-window-image"
                    onClick={openPhotoModal}
                  />
                  <p>
                    Taken on:{" "}
                    {new Date(
                      selectedPhoto.location!.timestamp
                    ).toLocaleString()}
                  </p>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </div>

        {/* Photo modal */}
        <IonModal
          isOpen={isModalOpen}
          onDidDismiss={() => setIsModalOpen(false)}
        >
          <div className="photo-modal">
            <IonButtons slot="end">
              <IonButton onClick={() => setIsModalOpen(false)}>
                <IonIcon icon={close} />
              </IonButton>
            </IonButtons>
            {selectedPhoto && (
              <IonImg src={selectedPhoto.webviewPath} className="full-image" />
            )}
          </div>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default Tab3;
