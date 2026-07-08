(function () {
  "use strict";

  var STORAGE_KEY = "ic_consent_v1";
  var STORAGE_VERSION = 1;
  // Re-prompt after this many days; matches the "up to 12 months" promise in the privacy policy.
  var REVALIDATE_DAYS = 365;

  function gtag() {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(arguments);
  }

  function readStored() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || parsed.v !== STORAGE_VERSION) return null;
      if (typeof parsed.ts !== "number") return null;
      var ageMs = Date.now() - parsed.ts;
      if (ageMs > REVALIDATE_DAYS * 24 * 60 * 60 * 1000) return null;
      return parsed;
    } catch (e) {
      return null;
    }
  }

  function writeStored(analytics) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ v: STORAGE_VERSION, ts: Date.now(), analytics: !!analytics })
      );
    } catch (e) {
      /* storage disabled; choice still applies for this page view */
    }
  }

  function applyConsent(analytics) {
    gtag("consent", "update", {
      analytics_storage: analytics ? "granted" : "denied"
    });

    window.dataLayer.push({
      event: "consent_updated",
      consent_analytics: analytics ? "granted" : "denied"
    });
  }

  function showBanner(el) {
    el.hidden = false;
    el.setAttribute("aria-hidden", "false");
  }

  function hideBanner(el) {
    el.hidden = true;
    el.setAttribute("aria-hidden", "true");
  }

  function openPrefs(panel) {
    var prefs = panel.querySelector("[data-consent-prefs]");
    if (prefs) prefs.removeAttribute("hidden");
  }

  function readToggle(panel) {
    var toggle = panel.querySelector("[data-consent-toggle='analytics']");
    return toggle ? toggle.checked : false;
  }

  function setToggle(panel, analytics) {
    var toggle = panel.querySelector("[data-consent-toggle='analytics']");
    if (toggle) toggle.checked = !!analytics;
  }

  function bind(el, panel) {
    if (el.dataset.bound === "1") return;
    el.dataset.bound = "1";

    var btnAccept = panel.querySelector("[data-consent-accept]");
    var btnReject = panel.querySelector("[data-consent-reject]");
    var btnSave = panel.querySelector("[data-consent-save]");

    if (btnAccept) {
      btnAccept.addEventListener("click", function () {
        writeStored(true);
        applyConsent(true);
        hideBanner(el);
      });
    }

    if (btnReject) {
      btnReject.addEventListener("click", function () {
        writeStored(false);
        applyConsent(false);
        hideBanner(el);
      });
    }

    if (btnSave) {
      btnSave.addEventListener("click", function () {
        var analytics = readToggle(panel);
        writeStored(analytics);
        applyConsent(analytics);
        hideBanner(el);
      });
    }
  }

  function init() {
    var el = document.querySelector("[data-consent-banner]");
    if (!el) return;
    var panel = el.querySelector(".ic-consent__panel") || el;
    bind(el, panel);

    var stored = readStored();
    if (stored) {
      applyConsent(stored.analytics);
      setToggle(panel, stored.analytics);
      hideBanner(el);
    } else {
      showBanner(el);
    }

    var triggers = document.querySelectorAll("[data-consent-open-prefs]");
    for (var i = 0; i < triggers.length; i++) {
      triggers[i].addEventListener("click", function (event) {
        event.preventDefault();
        var current = readStored();
        if (current) setToggle(panel, current.analytics);
        showBanner(el);
        openPrefs(panel);
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
