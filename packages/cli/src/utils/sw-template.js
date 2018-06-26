const preCacheUrls = [/* BLAZINGLY INSERT ASSETS */];

const IMG_LIMIT = 50;

self.addEventListener('install', function (event) {
  event.waitUntil(async function () {
    let cache = await caches.open('pre-cache');
    await cache.addAll(preCacheUrls);
  }());
});

self.addEventListener('activate', function (event) {
  console.log('Service worker active, ready to serve content!');
});

async function fetchAndCache(request, cacheName = 'asset-cache') {
  let fetchRequest = request.clone();
  let response = await fetch(fetchRequest);

  if (!response || !(response.status === 200 || response.status === 304 || response.status === 302) || response.type !== 'basic') {
    return response;
  }

  let responseToCache = response.clone();

  let cache = await caches.open(cacheName);
  cache.put(request, responseToCache);

  return response;
}

async function cleanCache(maxEntries, cacheName = 'image-cache') {
  let fetchCache = await caches.open(cacheName);
  let entries = await fetchCache.keys();
  if (entries.length > maxEntries) {
    let toRemove = entries.slice(0, entries.length - maxEntries);
    await Promise.all(toRemove.map(async entry => {
      return await fetchCache.delete(entry);
    }));
  }
}

self.addEventListener('fetch', function (event) {
  const isAsset = /.*\.(?:js|css)/g;
  const isImage = /.*\.(?:png|gif|jpg|jpeg|svg|bmp)/g;
  let request = event.request;
  let url = request.url + '';

  event.respondWith(async function () {
    if (!isAsset.test(url) && !isImage.test(url)) {
      try {
        return await fetchAndCache(request);
      } catch (e) {
        // fallback to cache...
      }
    }

    let cacheHit = await caches.match(event.request);
    if (cacheHit) {
      return cacheHit;
    }

    try {
      if (url.match(isImage)) {
        cleanCache(IMG_LIMIT);
        return await fetchAndCache(request, 'image-cache');
      }
      return await fetchAndCache(request);
    } catch (e)  {
      console.log('You appear to be offline, fallback to offline page.');
      return await caches.match('/offline');
    }
  }());
});