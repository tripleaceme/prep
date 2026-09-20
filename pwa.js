/* Prep — service worker registration and the install affordance.
 *
 * Chromium fires beforeinstallprompt and gives us a real install dialog.
 * iOS Safari never fires it and has no programmatic install at all, so there
 * the same button explains the Share → Add to Home Screen route instead.
 * When the app is already running installed, nothing is shown.
 */
(function () {
  "use strict";

  function t(s) {
    return (window.PrepI18n && window.PrepI18n.t(s)) || s;
  }

  var isStandalone =
    (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
    window.navigator.standalone === true;

  var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent || "") ||
    // iPadOS 13+ reports as a Mac, but a Mac has no touch points.
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  /* ---------- service worker ---------- */

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () {
        // Registration fails on file:// and in private windows. The app still
        // works fully online, it just is not installable, so this is not fatal.
      });
    });
  }

  /* ---------- install button ---------- */

  var button = document.getElementById("installBtn");
  if (!button || isStandalone) return;

  var deferredPrompt = null;

  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferredPrompt = e;
    button.hidden = false;
  });

  window.addEventListener("appinstalled", function () {
    deferredPrompt = null;
    button.hidden = true;
    hideHint();
  });

  var hint = null;

  function hideHint() {
    if (hint && hint.parentNode) hint.parentNode.removeChild(hint);
    hint = null;
  }

  function showIosHint() {
    if (hint) { hideHint(); return; }
    hint = document.createElement("div");
    hint.className = "install-hint";
    hint.setAttribute("role", "dialog");

    var title = document.createElement("strong");
    title.textContent = t("Add Prep to your home screen");

    var body = document.createElement("p");
    body.textContent = t("Tap the Share button in Safari, then choose Add to Home Screen.");

    var close = document.createElement("button");
    close.type = "button";
    close.className = "install-hint-close";
    close.textContent = t("Got it");
    close.addEventListener("click", hideHint);

    hint.appendChild(title);
    hint.appendChild(body);
    hint.appendChild(close);
    document.body.appendChild(hint);
  }

  button.addEventListener("click", function () {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(function (choice) {
        if (choice && choice.outcome === "accepted") button.hidden = true;
        deferredPrompt = null;
      });
      return;
    }
    if (isIOS) showIosHint();
  });

  // iOS gets the button immediately, since the event that would reveal it
  // is never going to arrive.
  if (isIOS) button.hidden = false;

  // Keep the button's label in the current language if it is swapped later.
  if (window.PrepI18n) {
    window.PrepI18n.onChange(function () { hideHint(); });
  }
})();
