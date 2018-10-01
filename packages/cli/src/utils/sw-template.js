/* global importScripts workbox:true */
/* eslint-env browser */

importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.3.1/workbox-sw.js');

const preCacheUrls = [
  /* BLAZINGLY INSERT ASSETS */
];

const matchNonPreCached = ({url}) => {
  return !preCacheUrls.includes(url) && !/.*\.(?:png|jpg|jpeg|svg|gif)/.test(url);
};

if (workbox) {
  // Register the blazingly assets
  workbox.precaching.precacheAndRoute(preCacheUrls);

  // Register cache for images
  workbox.routing.registerRoute(
    /.*\.(?:png|jpg|jpeg|svg|gif)/,
    workbox.strategies.cacheFirst({
      cacheName: 'image-cache',
      plugins: [
        new workbox.expiration.Plugin({
          maxEntries: 20,
          maxAgeSeconds: 7 * 24 * 60 * 60
        })
      ]
    })
  );

  // Cache everything else for offline use
  workbox.routing.registerRoute(
    matchNonPreCached,
    workbox.strategies.networkFirst({
      cacheName: 'offline-cache'
    })
  );
}
