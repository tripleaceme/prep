/* Prep — service worker registration and the install banner.
 *
 * Modelled on the install banner in session-companion: a slim dismissible strip
 * under the header rather than a permanent button in the menu, so it costs
 * nothing once the visitor has installed or said no.
 *
 * The banner renders only when there is something to offer. Chromium fires
 * beforeinstallprompt and gives us a real dialog; iOS Safari never fires it and
 * cannot install programmatically, so there the strip explains the two taps it
 * actually takes. A desktop browser that does neither gets nothing at all.
 */
(function () {
  "use strict";

  var DISMISSED_KEY = "prep.install-dismissed";

  function t(s) {
    return (window.PrepI18n && window.PrepI18n.t(s)) || s;
  }

  /* ---------- state ---------- */

  var deferredPrompt = null;
  var installable = false;
  var showIosHelp = false;

  function readDismissed() {
    try {
      return window.localStorage.getItem(DISMISSED_KEY) === "1";
    } catch (e) {
      return false;
    }
  }

  function detectStandalone() {
    // iOS uses a non-standard navigator flag; everyone else has the media query.
    var iosStandalone = "standalone" in window.navigator && window.navigator.standalone === true;
    return iosStandalone ||
      (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches);
  }

  function detectIos() {
    var ua = window.navigator.userAgent || "";
    // iPadOS 13+ reports itself as a Mac, so the touch-point check is what
    // separates an iPad from a desktop Safari that cannot install at all.
    return /iPad|iPhone|iPod/.test(ua) ||
      (/Macintosh/.test(ua) && window.navigator.maxTouchPoints > 1);
  }

  var standalone = detectStandalone();
  var ios = detectIos();
  var dismissed = readDismissed();

  /* ---------- service worker ---------- */

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js")["catch"](function () {
        // Registration fails on file:// and in private windows. The app still
        // works fully online, it simply will not open offline.
      });
    });
  }

  /* ---------- banner ---------- */

  var slot = document.getElementById("installSlot");
  if (!slot) return;

  function dismiss() {
    dismissed = true;
    try {
      window.localStorage.setItem(DISMISSED_KEY, "1");
    } catch (e) {
      // A browser blocking storage just means the banner returns next visit.
    }
    render();
  }

  function promptInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(function () {
      // The event is single-use; Chrome fires a fresh one if the visitor
      // declines and later becomes eligible again.
      deferredPrompt = null;
      installable = false;
      render();
    });
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function render() {
    slot.textContent = "";

    // Nothing to offer: already installed, dismissed, or a desktop browser that
    // never fired the event and has no manual route worth explaining.
    if (standalone || dismissed) return;
    if (!installable && !ios) return;

    var bar = el("div", "install-bar");
    var row = el("div", "install-row");

    row.appendChild(el("p", "install-label", t("Install")));
    row.appendChild(el("p", "install-copy",
      t("Add Prep to your home screen, so you can launch it like a native app.")));

    var action = el("button", "install-action");
    action.type = "button";
    if (installable) {
      action.textContent = t("Install");
      action.addEventListener("click", promptInstall);
    } else {
      action.textContent = t(showIosHelp ? "Hide" : "How");
      action.setAttribute("aria-expanded", showIosHelp ? "true" : "false");
      action.addEventListener("click", function () {
        showIosHelp = !showIosHelp;
        render();
      });
    }
    row.appendChild(action);

    var close = el("button", "install-dismiss", "✕");
    close.type = "button";
    close.setAttribute("aria-label", t("Dismiss install prompt"));
    close.addEventListener("click", dismiss);
    row.appendChild(close);

    bar.appendChild(row);

    // iOS Safari has no install event at all, so the only honest thing to do
    // is name the two taps it actually takes.
    if (showIosHelp && !installable) {
      bar.appendChild(el("p", "install-help",
        t("Tap Share icon of your browser, then Add to Home Screen.")));
    }

    slot.appendChild(bar);
  }

  window.addEventListener("beforeinstallprompt", function (e) {
    // Suppress Chrome's own mini-infobar so the prompt appears where we choose.
    e.preventDefault();
    deferredPrompt = e;
    installable = true;
    render();
  });

  window.addEventListener("appinstalled", function () {
    deferredPrompt = null;
    installable = false;
    standalone = true;
    render();
  });

  if (window.PrepI18n) window.PrepI18n.onChange(render);

  render();
})();
