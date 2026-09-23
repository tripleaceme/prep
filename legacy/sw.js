/* Prep service worker.
 *
 * Exists so the app is installable and the shell opens without a network round
 * trip. It deliberately does NOT touch cross-origin requests: the Gemini calls
 * are POSTs and one of them is an SSE stream, and intercepting those is the
 * usual way a service worker breaks a working app. Anything not handled here
 * falls through to the browser untouched.
 *
 * Bump CACHE_VERSION when the shell changes so old caches are discarded.
 */
var CACHE_VERSION = "prep-v1";

var SHELL = [
  "./",
  "./index.html",
  "./app.html",
  "./i18n.js",
  "./pwa.js",
  "./favicon.svg",
  "./favicon.ico",
  "./apple-touch-icon.png",
  "./icon-192.png",
  "./icon-512.png",
  "./site.webmanifest"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(function (cache) {
      // addAll is atomic — one 404 would reject the whole install, so each entry
      // is added individually and a missing optional file cannot block the update.
      return Promise.all(SHELL.map(function (url) {
        return cache.add(new Request(url, { cache: "reload" }))["catch"](function () {});
      }));
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (key) {
        return key === CACHE_VERSION ? null : caches["delete"](key);
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("message", function (event) {
  if (event.data === "skip-waiting") self.skipWaiting();
});

function networkFirst(request) {
  return fetch(request).then(function (response) {
    if (response && response.ok) {
      var copy = response.clone();
      caches.open(CACHE_VERSION).then(function (cache) { cache.put(request, copy); });
    }
    return response;
  })["catch"](function () {
    return caches.match(request).then(function (hit) {
      return hit || caches.match("./index.html");
    });
  });
}

function staleWhileRevalidate(request) {
  return caches.match(request).then(function (hit) {
    var network = fetch(request).then(function (response) {
      if (response && response.ok) {
        var copy = response.clone();
        caches.open(CACHE_VERSION).then(function (cache) { cache.put(request, copy); });
      }
      return response;
    })["catch"](function () { return hit; });
    return hit || network;
  });
}

self.addEventListener("fetch", function (event) {
  var request = event.request;

  // Leave everything that is not a plain same-origin GET to the browser. That
  // covers the Gemini POST and its SSE stream, and Google Fonts.
  if (request.method !== "GET") return;

  var url;
  try { url = new URL(request.url); } catch (e) { return; }
  if (url.origin !== self.location.origin) return;

  // HTML goes network-first so a new deploy is picked up rather than pinned,
  // with the cache as the offline fallback.
  if (request.mode === "navigate" || (request.headers.get("accept") || "").indexOf("text/html") !== -1) {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});
