import { ToastProps } from 'nightwatch-ui';
import { SnackbarKey } from 'notistack';
import { useEffect } from 'react';
import { isIOS } from 'react-device-detect';
import { getEnvironment, useToast } from 'skiff-front-utils';
import { Workbox } from 'workbox-window';

import {
  RELOAD_BROWSER,
  RELOAD_NEW_WORKER_MESSAGE,
  SERVICE_WORKER_VERSION,
  SHOULD_FORCE_WORKER_UPDATE_MESSAGE
} from '../../utils/serviceWorker';

const ONE_HOUR_IN_MILISEC = 1000 * 60 * 60;

const serviceWorkerSupported = typeof window === 'object' && 'serviceWorker' in navigator; // Sw is supported on client side and when serviceWorker is in navigator

// Disable SW On Dev and vercel
const enabled =
  typeof window === 'object' &&
  getEnvironment(new URL(window.location.origin)) !== 'local' &&
  getEnvironment(new URL(window.location.origin)) !== 'vercel';

const getCacheServiceWorker = () => new Workbox('/mail/sw.js', { scope: '/mail' });

const getRegistration = () => navigator.serviceWorker.getRegistration('/mail/sw.js');

let currentSWVersion = 0; // Default value of currentSWVersion is 0 - DO NOT CHANGE
let forceUpdate = false; // Default value of forceUpdate is false - DO NOT CHANGE

/**
 * If there is already a waiting worker and the user has not reloaded the page, force the update.
 * that wil refresh the page before the app is up so the user won't notice it.
 * On ios webview however it takes time for us to be able to see if a service worker registration states
 * so we add a timeout for it
 */
const updateIfWaiting = (registration: ServiceWorkerRegistration) => {
  if (registration.active && registration.waiting && navigator.serviceWorker.controller) {
    registration.waiting.postMessage({ message: RELOAD_NEW_WORKER_MESSAGE });
  }
};

const registerServiceWorker = async () => {
  console.log('Loading service worker');
  if (serviceWorkerSupported) {
    console.log('Browser supports service worker!');
    try {
      const wb = getCacheServiceWorker();
      const registration = await wb.register();
      if (!registration) return;
      if (registration.installing) {
        console.log('Service worker installing');
        registration.installing.postMessage({ message: SERVICE_WORKER_VERSION });
      } else if (registration.waiting) {
        console.log('Service worker installed');
        registration.waiting.postMessage({ message: SERVICE_WORKER_VERSION });
      } else if (registration.active) {
        console.log('Service worker active');
        registration.active.postMessage({ message: SERVICE_WORKER_VERSION });
      }
    } catch (error) {
      console.error(`Registration failed with ${error}`);
    }
  }
};

/**
 * When a new version of the service worker is available, he wont be used until the next time the page hard-refreshes.
 * We can force-update him by using 'skipWaiting', and then reload the page.
 * (this is why we must reload the page https://web.dev/service-worker-lifecycle/#skip-the-waiting-phase).
 *
 * This function listen to service worker updates, and when finding one lets the user refresh the page to use the new worker.
 *
 * see https://whatwebcando.today/articles/handling-service-worker-updates/
 */
const listenForServiceWorkerUpdates = async (
  enqueueToast: (toastProps: ToastProps) => SnackbarKey,
  closeToast: (toastKey: SnackbarKey | undefined) => void
) => {
  const registration = await getRegistration();

  if (!registration) return;

  setTimeout(() => updateIfWaiting(registration), isIOS ? 1000 : 0);

  /**
   * listen to update of the service worker - handles updates polling (see useEffect in the hook)
   * If update found suggest the user to reload the page.
   * if he reloads apply skipWaiting to activate the new service worker and refresh the page
   */
  registration.addEventListener('updatefound', () => {
    const newWorker = registration?.installing;
    if (!newWorker) return;
    // Ask the new worker if we should force update
    newWorker.postMessage({ message: SHOULD_FORCE_WORKER_UPDATE_MESSAGE, version: currentSWVersion });
    // listen to the new worker state changes
    newWorker.addEventListener('statechange', () => {
      // the new instance is now waiting for activation (its state is 'installed')
      // we now may invoke our update safely
      if (registration?.waiting && navigator.serviceWorker.controller) {
        if (forceUpdate) {
          enqueueToast({
            body: 'Important update found, reloading',
            persist: false
          });
        } else {
          enqueueToast({
            body: 'New version available',
            persist: true,
            actions: [
              {
                label: 'Reload page',
                onClick: (key) => {
                  closeToast(key);
                  // post message to the service worker to skipWaiting and refresh the page
                  if (registration?.waiting) registration.waiting.postMessage({ message: RELOAD_NEW_WORKER_MESSAGE });
                  enqueueToast({
                    body: 'Reloading...',
                    persist: false
                  });
                }
              }
            ]
          });
        }
      }
    });
  });
};

export default function useCachingWorker() {
  const { enqueueToast, closeToast } = useToast();

  const handleServiceWorkerMessage = (event: MessageEvent) => {
    const message = event.data.message;
    switch (message) {
      case RELOAD_BROWSER:
        window.location.reload();
        break;
      case SHOULD_FORCE_WORKER_UPDATE_MESSAGE:
        forceUpdate = event.data.forceUpdate;
        break;
      case SERVICE_WORKER_VERSION:
        // If the version is greater that current set version update it
        console.log('SW Version', event.data.version);
        if (event.data.version > currentSWVersion) {
          currentSWVersion = event.data.version;
        }
        break;
    }
  };

  // start an interval to check for updates
  useEffect(() => {
    if (!enabled || !serviceWorkerSupported) return;
    const interval = setInterval(async () => {
      const registration = await getRegistration();
      if (!registration) return;
      await registration.update();
    }, ONE_HOUR_IN_MILISEC);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!enabled || !serviceWorkerSupported) return; // Disable on local and when not supported
    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    registerServiceWorker();
    listenForServiceWorkerUpdates(enqueueToast, closeToast);
  }, []);
}
