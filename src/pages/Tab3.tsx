import React, { useState, useCallback, useEffect } from "react";
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
  IonText,
  IonFooter,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  isPlatform,
} from "@ionic/react";
import {
  close,
  arrowBack,
  locationOutline,
  calendarOutline,
} from "ionicons/icons";
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

  // Google Maps API key
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyD3ZX9bd0NXO31uiT2GYZklqezHy9Ckrb4",
    id: "google-map-script",
  });

  // Filter photos that have location data
  const photosWithLocation = photos.filter(
    (photo) =>
      photo.location && photo.location.latitude && photo.location.longitude
  );

  // Log photos with location for debugging
  useEffect(() => {
    console.log("Photos with location:", photosWithLocation);
    if (photosWithLocation.length > 0) {
      console.log("First photo location:", photosWithLocation[0].location);
    } else {
      console.log("No photos with location found");
    }
  }, [photosWithLocation]);

  // Handle map load
  const onMapLoad = useCallback(
    (map: google.maps.Map) => {
      console.log("Map loaded successfully");

      // If we have photos with location, center on the first one
      if (photosWithLocation.length > 0 && photosWithLocation[0].location) {
        const newCenter = {
          lat: photosWithLocation[0].location.latitude,
          lng: photosWithLocation[0].location.longitude,
        };
        setMapCenter(newCenter);
        map.setCenter(newCenter);
        map.setZoom(15); // Closer zoom for better visibility
      }
    },
    [photosWithLocation]
  );

  // Handle marker click
  const handleMarkerClick = (photo: UserPhoto) => {
    console.log("Marker clicked, photo:", photo);
    setSelectedPhoto(photo);
    setIsInfoWindowOpen(true);
  };

  // Open modal with full photo
  const openPhotoModal = () => {
    console.log("Opening modal for photo:", selectedPhoto);
    setIsModalOpen(true);
    setIsInfoWindowOpen(false); // Close info window when opening modal
  };

  // Close modal
  const closePhotoModal = () => {
    setIsModalOpen(false);
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

        {/* Debug info for photos */}
        {photosWithLocation.length === 0 && (
          <div className="map-message">
            <p>No photos with location data found.</p>
            <p>Take photos with location enabled in the Photos tab.</p>
          </div>
        )}

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
              zoomControl: true,
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
                animation={google.maps.Animation.DROP}
              />
            ))}

            {selectedPhoto && isInfoWindowOpen && selectedPhoto.location && (
              <InfoWindow
                position={{
                  lat: selectedPhoto.location.latitude,
                  lng: selectedPhoto.location.longitude,
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
                    <IonIcon icon={calendarOutline} />{" "}
                    {new Date(
                      selectedPhoto.location.timestamp
                    ).toLocaleString()}
                  </p>
                  <IonButton
                    size="small"
                    expand="block"
                    onClick={openPhotoModal}
                  >
                    View Full Image
                  </IonButton>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </div>

        {/* Improved Photo modal */}
        <IonModal
          isOpen={isModalOpen}
          onDidDismiss={closePhotoModal}
          className="photo-modal-wrapper"
        >
          <IonHeader>
            <IonToolbar>
              <IonButtons slot="start">
                <IonButton onClick={closePhotoModal}>
                  <IonIcon slot="icon-only" icon={close} />
                </IonButton>
              </IonButtons>
              <IonTitle>Photo Details</IonTitle>
            </IonToolbar>
          </IonHeader>

          <IonContent className="photo-modal-content">
            {selectedPhoto && (
              <IonCard>
                <IonImg
                  src={selectedPhoto.webviewPath}
                  className="full-image"
                />

                {selectedPhoto.location && (
                  <IonCardContent>
                    <p>
                      <IonIcon icon={locationOutline} /> Coordinates:{" "}
                      {selectedPhoto.location.latitude.toFixed(6)},{" "}
                      {selectedPhoto.location.longitude.toFixed(6)}
                    </p>
                    <p>
                      <IonIcon icon={calendarOutline} /> Taken on:{" "}
                      {new Date(
                        selectedPhoto.location.timestamp
                      ).toLocaleString()}
                    </p>
                  </IonCardContent>
                )}
              </IonCard>
            )}
          </IonContent>

          <IonFooter>
            <IonToolbar>
              <IonButton expand="block" onClick={closePhotoModal}>
                Close
              </IonButton>
            </IonToolbar>
          </IonFooter>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default Tab3;
