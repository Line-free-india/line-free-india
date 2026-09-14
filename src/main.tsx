import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from 'react-helmet-async';
import { ToastProvider } from './components/ToastSystem';
import "./index.css";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import { registerServiceWorker, startUpdateChecker } from './utils/updateChecker';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

// Only run web PWA auto-update checker and service worker in browsers
if (!Capacitor.isNativePlatform()) {
  registerServiceWorker();
  startUpdateChecker();
} else {
  // Native Android configuration: never overlay status bar, use light status bar with dark icons
  try {
    StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
    StatusBar.setStyle({ style: Style.Light }).catch(() => {});
    StatusBar.setBackgroundColor({ color: '#FFFFFF' }).catch(() => {});
  } catch (e) {
    console.warn('StatusBar config error:', e);
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </HelmetProvider>
    </ErrorBoundary>
  </StrictMode>
);
