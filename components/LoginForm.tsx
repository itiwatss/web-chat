"use client";

import { useState } from "react";
import { api, errorMessage } from "@/lib/api";
import { useInbox } from "./InboxContext";

export default function LoginForm() {
  const { unlock } = useInbox();
  const [username, setUsername] = useState("");
  const [pw, setPw] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError("");
    try {
      await api.post("/api/auth/login", { username, password: pw });
      setPw("");
      unlock();
    } catch (err) {
      setLoginError(errorMessage(err, "Login failed"));
    } finally {
      setLoggingIn(false);
    }
  }

  return (
    <form className="ib-lock" onSubmit={login}>
      <h1>Webchat Login</h1>
      <p className="ib-hint" id="login-hint">
        <ion-icon name="information-circle" aria-hidden="true"></ion-icon>
        <span>
          Use <strong>admin</strong> with password <strong>test1234</strong>
        </span>
      </p>
      {loginError && (
        <p className="ib-hint ib-hint-error" role="alert">
          <ion-icon name="alert-circle" aria-hidden="true"></ion-icon>
          <span>{loginError}</span>
        </p>
      )}
      <input
        className="ib-input"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
        aria-label="Username"
        aria-describedby="login-hint"
        autoComplete="username"
        required
      />
      <input
        className="ib-input"
        type="password"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        placeholder="Password"
        aria-label="Password"
        autoComplete="current-password"
        required
      />
      <button className="ib-send" style={{ padding: 10 }} disabled={loggingIn}>
        {loggingIn ? "Logging in" : "Log in"}
      </button>
    </form>
  );
}
