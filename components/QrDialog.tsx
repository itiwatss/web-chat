"use client";

import { useEffect, useRef } from "react";
import { useInbox } from "./InboxContext";

export default function QrDialog() {
  const { qrOpen, closeQr } = useInbox();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (qrOpen && !dialog.open) dialog.showModal();
    if (!qrOpen && dialog.open) dialog.close();
  }, [qrOpen]);

  return (
    <dialog
      ref={ref}
      className="ib-qr"
      aria-labelledby="qr-title"
      aria-describedby="qr-desc"
      onClose={closeQr}
      onClick={(e) => e.target === e.currentTarget && closeQr()}
    >
      <div className="ib-qr-card">
        <button className="ib-qr-close" onClick={closeQr} aria-label="Close">
          <ion-icon name="close-outline" aria-hidden="true"></ion-icon>
        </button>
        <div className="ib-qr-badge" aria-hidden="true">
          <ion-icon name="qr-code-outline"></ion-icon>
        </div>
        <h2 id="qr-title">Scan QR code</h2>
        <p id="qr-desc" className="ib-qr-desc">
          Scan this QR code with LINE to add your LINE Official Account as a friend.
        </p>
        <div className="ib-qr-frame">
          <img src="/line-qr.png" alt="QR code to add our LINE Official Account" width={220} height={220} />
        </div>
        <button className="ib-qr-done" onClick={closeQr} autoFocus>
          Done
        </button>
      </div>
    </dialog>
  );
}
