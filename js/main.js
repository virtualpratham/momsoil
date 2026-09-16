// Mom's Oil — shared site behaviour
(function () {
  "use strict";

  var WHATSAPP_NUMBER = "918887935854"; // international format, no + or spaces
  var UPI_ID = "mailmetomadhuri@okhdfcbank";
  var PRICE = 269;
  var MRP = 339;
  var PRODUCT = "Mom's Oil — Home Made Hair Oil (100ml)";

  /* ---------- Scroll reveals ---------- */
  var revealTargets = document.querySelectorAll(
    "main section > .wrap > *, " +
    ".ingredients-grid > *, .benefits-row > *, .how-it-works ol > *, " +
    ".faq-list > *, .trust-strip > *, .product-actions > *"
  );
  if (revealTargets.length) {
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches && "IntersectionObserver" in window) {
      var revealObserver = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -40px" });

      revealTargets.forEach(function (target, index) {
        target.classList.add("reveal");
        target.style.setProperty("--reveal-delay", Math.min(index % 6, 5) * 70 + "ms");
        revealObserver.observe(target);
      });
    } else {
      revealTargets.forEach(function (target) {
        target.classList.add("is-visible");
      });
    }
  }

  /* ---------- Mobile nav ---------- */
  var toggle = document.querySelector(".menu-toggle");
  var nav = document.querySelector(".main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      nav.classList.toggle("open");
      var open = nav.classList.contains("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.classList.toggle("nav-open", open);
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("open");
        document.body.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- Copy UPI ID ---------- */
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var text = btn.getAttribute("data-copy");
      var restore = btn.textContent;
      navigator.clipboard
        .writeText(text)
        .then(function () {
          btn.textContent = "Copied";
          setTimeout(function () {
            btn.textContent = restore;
          }, 1600);
        })
        .catch(function () {
          window.prompt("Copy your UPI ID:", text);
        });
    });
  });

  /* ---------- Product image gallery ---------- */
  var thumbsWrap = document.getElementById("product-thumbs");
  var mainImage = document.getElementById("main-product-image");
  if (thumbsWrap && mainImage) {
    thumbsWrap.querySelectorAll("button[data-image]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        mainImage.src = btn.getAttribute("data-image");
        thumbsWrap.querySelectorAll("button").forEach(function (b) {
          b.classList.remove("active");
        });
        btn.classList.add("active");
      });
    });
  }

  /* ---------- Order form (2-step: address -> payment) ---------- */
  var addressForm = document.getElementById("address-form");
  if (!addressForm) return;

  var paymentStep = document.getElementById("payment-step");
  var backBtn = document.getElementById("back-to-address");
  var confirmBtn = document.getElementById("confirm-order-btn");
  var stepIndicators = document.querySelectorAll("#order-steps .step-indicator");

  var qtyInput = document.getElementById("qty");
  var subtotalEls = document.querySelectorAll("[data-summary-subtotal]");
  var totalEls = document.querySelectorAll("[data-summary-total]");
  var qtyLineEls = document.querySelectorAll("[data-summary-qty]");
  var discountRows = document.querySelectorAll("[data-discount-row]");
  var discountLabelEls = document.querySelectorAll("[data-discount-label]");
  var discountAmountEls = document.querySelectorAll("[data-discount-amount]");

  function currency(n) {
    return "\u20B9" + Math.round(n).toLocaleString("en-IN");
  }

  /* Extra discount tiers on top of the per-bottle price: 5% for 2 bottles, 10% for 3+ */
  function getExtraDiscountPct(qty) {
    if (qty >= 3) return 10;
    if (qty === 2) return 5;
    return 0;
  }

  function getPricing(qty) {
    var subtotal = PRICE * qty;
    var discountPct = getExtraDiscountPct(qty);
    var discountAmount = Math.round((subtotal * discountPct) / 100);
    var total = subtotal - discountAmount;
    return { subtotal: subtotal, discountPct: discountPct, discountAmount: discountAmount, total: total };
  }

  /* ---------- Live UPI QR (reflects the exact amount owed) ---------- */
  var qrTarget = document.getElementById("upi-qr");
  var qrInstance = null;
  if (qrTarget && typeof QRCode !== "undefined") {
    qrInstance = new QRCode(qrTarget, {
      text: buildUpiUri(PRICE),
      width: 180,
      height: 180,
      colorDark: "#2C2115",
      colorLight: "#FFFDF7",
      correctLevel: QRCode.CorrectLevel.H,
    });
  }

  function buildUpiUri(amount) {
    return (
      "upi://pay?pa=" + encodeURIComponent(UPI_ID) +
      "&pn=" + encodeURIComponent("Moms Oil") +
      "&am=" + amount.toFixed(2) +
      "&cu=INR"
    );
  }

  function updateQr(amount) {
    if (!qrInstance) return;
    qrInstance.clear();
    qrInstance.makeCode(buildUpiUri(amount));
  }

  function updateSummary() {
    var qty = parseInt(qtyInput.value, 10) || 1;
    var pricing = getPricing(qty);
    var qtyText = qty + " \u00D7 100ml bottle" + (qty > 1 ? "s" : "");

    qtyLineEls.forEach(function (el) { el.textContent = qtyText; });
    subtotalEls.forEach(function (el) { el.textContent = currency(pricing.subtotal); });
    totalEls.forEach(function (el) { el.textContent = currency(pricing.total); });

    discountRows.forEach(function (row) {
      if (pricing.discountPct > 0) {
        row.hidden = false;
      } else {
        row.hidden = true;
      }
    });
    discountLabelEls.forEach(function (el) {
      el.textContent = "Extra " + pricing.discountPct + "% off (" + qty + " bottles)";
    });
    discountAmountEls.forEach(function (el) {
      el.textContent = "\u2212" + currency(pricing.discountAmount);
    });

    updateQr(pricing.total);
    return pricing;
  }
  if (qtyInput) {
    qtyInput.addEventListener("input", updateSummary);
    updateSummary();
  }

  function showError(field, message) {
    field.classList.add("invalid");
    var err = field.querySelector(".field-error");
    if (err) err.textContent = message;
  }
  function clearError(field) {
    field.classList.remove("invalid");
  }

  function setStep(step) {
    if (step === 2) {
      addressForm.classList.remove("active");
      paymentStep.classList.add("active");
      paymentStep.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      paymentStep.classList.remove("active");
      addressForm.classList.add("active");
      addressForm.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    stepIndicators.forEach(function (el) {
      var isStep2 = el.getAttribute("data-step") === "2";
      el.classList.toggle("active", isStep2 ? step === 2 : step === 1);
      el.classList.toggle("done", isStep2 ? false : step === 2);
    });
  }

  /* Step 1 -> Step 2: validate address, then reveal payment */
  addressForm.addEventListener("submit", function (e) {
    e.preventDefault();

    var fields = {
      name: document.getElementById("name"),
      phone: document.getElementById("phone"),
      address: document.getElementById("address"),
      city: document.getElementById("city"),
      state: document.getElementById("state"),
      pincode: document.getElementById("pincode"),
    };

    var valid = true;

    Object.keys(fields).forEach(function (key) {
      var input = fields[key];
      var field = input.closest(".field");
      clearError(field);
      if (!input.value.trim()) {
        showError(field, "This field is required.");
        valid = false;
      }
    });

    var phoneVal = fields.phone.value.trim().replace(/\s|-/g, "");
    if (phoneVal && !/^[6-9]\d{9}$/.test(phoneVal)) {
      showError(fields.phone.closest(".field"), "Enter a valid 10-digit mobile number.");
      valid = false;
    }
    var pinVal = fields.pincode.value.trim();
    if (pinVal && !/^\d{6}$/.test(pinVal)) {
      showError(fields.pincode.closest(".field"), "Enter a valid 6-digit pincode.");
      valid = false;
    }

    if (!valid) {
      var firstInvalid = addressForm.querySelector(".invalid");
      if (firstInvalid) firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    updateSummary();
    setStep(2);
  });

  /* Step 2 -> Step 1 */
  if (backBtn) {
    backBtn.addEventListener("click", function () {
      setStep(1);
    });
  }

  /* Step 2: confirm payment -> send order details to WhatsApp */
  if (confirmBtn) {
    confirmBtn.addEventListener("click", function () {
      var qty = parseInt(qtyInput.value, 10) || 1;
      var pricing = getPricing(qty);
      var landmark = document.getElementById("landmark").value.trim();
      var name = document.getElementById("name").value.trim();
      var phoneVal = document.getElementById("phone").value.trim().replace(/\s|-/g, "");
      var address = document.getElementById("address").value.trim();
      var city = document.getElementById("city").value.trim();
      var state = document.getElementById("state").value.trim();
      var pinVal = document.getElementById("pincode").value.trim();

      var lines = [
        "Hi Mom's Oil, I'd like to place an order \uD83C\uDF3F",
        "",
        "Product: " + PRODUCT,
        "Quantity: " + qty,
        "Subtotal: " + currency(pricing.subtotal) + " (MRP " + currency(MRP * qty) + ")",
        pricing.discountPct > 0
          ? "Extra discount: " + pricing.discountPct + "% off (\u2212" + currency(pricing.discountAmount) + ")"
          : null,
        "Total: " + currency(pricing.total),
        "",
        "Name: " + name,
        "Phone: " + phoneVal,
        "Address: " + address,
        landmark ? "Landmark: " + landmark : null,
        "City: " + city,
        "State: " + state,
        "Pincode: " + pinVal,
        "",
        "Payment: I've paid " + currency(pricing.total) + " via UPI to " + UPI_ID + " and I'm attaching the screenshot here.",
      ].filter(Boolean);

      var message = encodeURIComponent(lines.join("\n"));
      var url = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + message;

      var successBox = document.getElementById("form-success");
      if (successBox) {
        successBox.classList.add("show");
        successBox.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      window.open(url, "_blank");
    });
  }
})();
