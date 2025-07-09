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
} from "@ionic/react";
import { camera, trash, close } from "ionicons/icons";
import ExploreContainer from "../components/ExploreContainer";
import { usePhotoGallery, UserPhoto } from "../hooks/usePhotoGallery";
import "./Tab2.css";

const Tab2: React.FC = () => {
  const { photos, takePhoto, deletePhoto } = usePhotoGallery();
  const [photoToDelete, setPhotoToDelete] = useState<UserPhoto>();
  const [showToast, setShowToast] = useState(false);
  function handleScrollStart() {
    console.log("scroll start");
  }

  function handleScroll(event: CustomEvent<ScrollDetail>) {
    console.log("scroll", JSON.stringify(event.detail));
  }

  function handleScrollEnd() {
    console.log("scroll end");
  }

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
            <IonTitle size="large">Tab 2</IonTitle>
          </IonToolbar>
        </IonHeader>
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
