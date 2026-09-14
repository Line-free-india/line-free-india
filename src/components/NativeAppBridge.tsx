import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { useToast } from './ToastSystem';

export default function NativeAppBridge() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();
  const lastBackPressTime = useRef<number>(0);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // 1. Hide native splash screen once React is mounted
    SplashScreen.hide({ fadeOutDuration: 300 }).catch(() => {});

    // 2. Pre-warm / initialize Google Auth on app launch
    try {
      GoogleAuth.initialize({
        clientId: '848717293503-jl6isf2gqs9fmca1nte72c63idm4qqin.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
        grantOfflineAccess: false,
      });
    } catch (e) {
      console.warn('Native GoogleAuth init warning:', e);
    }

    // 3. Native Android Hardware Back Button listener
    const backListener = CapApp.addListener('backButton', () => {
      const path = window.location.pathname;
      const rootRoutes = [
        '/',
        '/customer/home',
        '/barber/home',
        '/business/home',
        '/login',
        '/customer/auth',
        '/barber/auth',
        '/role-select',
      ];

      const isRoot = rootRoutes.includes(path);

      if (!isRoot) {
        // Navigate back in history
        navigate(-1);
      } else {
        const now = Date.now();
        if (now - lastBackPressTime.current < 2000) {
          CapApp.exitApp();
        } else {
          lastBackPressTime.current = now;
          addToast('Press back again to exit', 'info');
        }
      }
    });

    return () => {
      backListener.then((sub) => sub.remove()).catch(() => {});
    };
  }, [navigate, location.pathname, addToast]);

  return null;
}
