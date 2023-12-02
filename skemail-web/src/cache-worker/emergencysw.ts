/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope; // https://github.com/microsoft/TypeScript/issues/14877#issuecomment-1057795918
import { RELOAD_BROWSER } from '../utils/serviceWorker';
// no-op service worker that takes immediate control.
// incase of a bug with the service worker that doesn't enables updates/need to deliver fast fix for a bug do the following steps:
// 1. replace this service worker with sw.ts
// 2. add /[^\n]+/ to InjectManifest exclude config in next.config.js
// 3. remove additional manifest entries in InjectManifest config

// IMPORTANT !!!
// When deploying a no-op service worker,
// be certain that the service worker URL remains unchanged! That means we should copy this code directly to sw.ts without changing the file name.
// Otherwise, the no-op service worker will be active along with the buggy service worker, and problems will persist.

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: __WB_MANIFEST
const manifest = self.__WB_MANIFEST; // This part has no affect - is here to avoid workbox build issues
console.log('Precache Manifest', manifest);

self.addEventListener('install', () => {
  // Skip over the "waiting" lifecycle state, to ensure that our
  // new service worker is activated immediately, even if there's
  // another tab open controlled by our older service worker code.
  void self.skipWaiting();
});

// eslint-disable-next-line @typescript-eslint/no-misused-promises
self.addEventListener('activate', async () => {
  // Get a list of all the current open windows/tabs under
  // our service worker's control, and force them to reload.
  // This can "unbreak" any open windows/tabs as soon as the new
  // service worker activates, rather than users having to manually reload.
  const tabs = await self.clients.matchAll({ type: 'window' });
  tabs.forEach((tab) => {
    tab.postMessage({ message: RELOAD_BROWSER });
  });
});
