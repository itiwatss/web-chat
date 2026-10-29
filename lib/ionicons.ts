import {
  arrowBackOutline,
  closeOutline,
  imageOutline,
  informationCircle,
  qrCodeOutline,
} from "ionicons/icons";

const ICONS = {
  "arrow-back-outline": arrowBackOutline,
  "close-outline": closeOutline,
  "image-outline": imageOutline,
  "information-circle": informationCircle,
  "qr-code-outline": qrCodeOutline,
};

let registered = false;

export async function registerIonicons(): Promise<void> {
  if (registered || typeof window === "undefined") return;
  registered = true;
  const [{ addIcons }, { defineCustomElement }] = await Promise.all([
    import("ionicons"),
    import("ionicons/components/ion-icon.js"),
  ]);
  addIcons(ICONS);
  defineCustomElement();
}
