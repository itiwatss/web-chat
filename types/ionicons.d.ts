import type { HTMLAttributes } from "react";
import type { JSX as IonJSX } from "ionicons";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "ion-icon": IonJSX.IonIcon & HTMLAttributes<HTMLElement>;
    }
  }
}
