/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope; // https://github.com/microsoft/TypeScript/issues/14877#issuecomment-1057795918
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';

import {
  SHOULD_FORCE_WORKER_UPDATE_MESSAGE,
  RELOAD_BROWSER,
  RELOAD_NEW_WORKER_MESSAGE,
  SERVICE_WORKER_VERSION
} from '../utils/serviceWorker';

const version = 9.0; // Version of the current sw, each increment of 1 will force update sw

const shouldForceUpdate = (activeVersion: number) => {
  // We should update whenever version is incremented by 1
  return version - Math.floor(activeVersion) >= 1;
};

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: __WB_MANIFEST
const manifest = self.__WB_MANIFEST; // This is replaced by workbox-webpack-plugin with the auto-generated manifest
console.log('Precache Manifest', manifest);
precacheAndRoute(manifest);
// Bound navigation to pre-cached /mail route
registerRoute(new NavigationRoute(createHandlerBoundToURL('/mail')));

/**
 * handle workers updates.
 * when receiving a message for reload, skipWaiting for the current waiting worker and refreshes all open tabs
 */
self.addEventListener('message', (ev) => {
  // To support old sw versions that used ev.data as event type, check type of it ev.data
  // if it is a string it means it is the old version
  const eventType = typeof ev.data === 'string' ? ev.data : ev.data.message;
  switch (eventType) {
    case RELOAD_NEW_WORKER_MESSAGE:
      // force the new worker to replace the old one
      void self.skipWaiting();
      break;
    case SHOULD_FORCE_WORKER_UPDATE_MESSAGE:
      const forceUpdate = shouldForceUpdate(ev.data.version || 0);
      ev.source?.postMessage({ message: SHOULD_FORCE_WORKER_UPDATE_MESSAGE, forceUpdate });
      if (forceUpdate) self.skipWaiting();
      break;
    case SERVICE_WORKER_VERSION:
      ev.source?.postMessage({ message: SERVICE_WORKER_VERSION, version });
      break;
  }
});

self.addEventListener('activate', async () => {
  // Get all tabs with sw
  const tabs = await self.clients.matchAll({ type: 'window' });
  tabs.forEach((tab) => {
    // and refresh each one of them
    // client.Navigate is not supported on ios, so we refresh tabs from the tab itself, not service worker
    tab.postMessage({ message: RELOAD_BROWSER });
  });
});
