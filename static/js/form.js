(function () {
  "use strict";

  var LEAD_ENDPOINT = "https://api.ilaequor.com/lead";

  function showFieldError(input, errorEl) {
    input.setAttribute("aria-invalid", "true");
    if (errorEl) errorEl.hidden = false;
  }

  function clearFieldError(input, errorEl) {
    input.removeAttribute("aria-invalid");
    if (errorEl) errorEl.hidden = true;
  }

  function showSuccess(form, statusEl) {
    var children = form.children;
    for (var i = 0; i < children.length; i++) {
      if (children[i] !== statusEl) children[i].hidden = true;
    }
    statusEl.hidden = false;

    var fields = form.querySelectorAll("input, button");
    for (var j = 0; j < fields.length; j++) {
      fields[j].disabled = true;
    }

    var button = form.querySelector("button[type='submit']");
    var label = button ? button.getAttribute("data-success-label") : null;
    button.textContent = label;
  }

  function bind(form) {
    if (form.dataset.bound === "1") return;
    form.dataset.bound = "1";

    var emailInput = form.querySelector("input[type='email']");
    var honeypot = form.querySelector("input[name='website']");
    var button = form.querySelector("button[type='submit']");
    var errorEl = emailInput ? emailInput.parentElement.querySelector("p") : null;
    var statusEl = form.querySelector("p[role='status']");
    var loadingLabel = button ? button.getAttribute("data-loading-label") : null;
    var idleLabel = button ? button.textContent : null;

    if (emailInput) {
      emailInput.addEventListener("input", function () {
        if (emailInput.getAttribute("aria-invalid") === "true" && emailInput.checkValidity()) {
          clearFieldError(emailInput, errorEl);
        }
      });
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      if (honeypot && honeypot.value) return;
      if (!emailInput) return;

      if (!emailInput.checkValidity()) {
        showFieldError(emailInput, errorEl);
        emailInput.focus();
        return;
      }
      clearFieldError(emailInput, errorEl);

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var email = emailInput.value;

      if (button) {
        button.disabled = true;
        if (loadingLabel) button.textContent = loadingLabel;
      }

      fetch(LEAD_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email })
      })
        .then(function (response) {
          if (response.status !== 204) throw new Error("lead signup failed");

          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push({ event: "lead_signup", email: email });

          if (statusEl) showSuccess(form, statusEl);
        })
        .catch(function () {
          showFieldError(emailInput, errorEl);
          if (button) {
            button.disabled = false;
            if (idleLabel) button.textContent = idleLabel;
          }
        });
    });
  }

  function init() {
    var forms = document.querySelectorAll("[data-waitlist-form]");
    for (var i = 0; i < forms.length; i++) {
      bind(forms[i]);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
