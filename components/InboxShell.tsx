"use client";

import type { ReactNode } from "react";
import { useInbox } from "./InboxContext";
import LoginForm from "./LoginForm";
import QrDialog from "./QrDialog";
import "./inbox.css";

export default function InboxShell({ children }: { children: ReactNode }) {
  const { locked, selected } = useInbox();
  if (locked) return <LoginForm />;
  return (
    <>
      <div className={`ib${selected ? " has-sel" : ""}`}>{children}</div>
      <QrDialog />
    </>
  );
}
