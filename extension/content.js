// EarlybirdTalent Content Script — runs on LinkedIn profile pages
// Extracts candidate data from the visible page and sends to popup
// Uses multiple selector strategies to handle LinkedIn's changing DOM

(function() {

  /* ── helpers ──────────────────────────────────────────────── */
  function txt(el) {
    return el ? el.textContent.replace(/\s+/g, " ").trim() : "";
  }

  function q(sel) {
    return document.querySelector(sel);
  }

  function qAll(sel) {
    return Array.from(document.querySelectorAll(sel));
  }

  // Try multiple selectors, return first match
  function trySelectors(selectors) {
    for (var i = 0; i < selectors.length; i++) {
      var el = document.querySelector(selectors[i]);
      if (el && txt(el)) return el;
    }
    return null;
  }

  /* ── main extraction ─────────────────────────────────────── */
  function extractProfile() {
    var data = {
      url: window.location.href.split("?")[0].replace(/\/$/,""),
      firstName: "",
      lastName: "",
      headline: "",
      jobTitle: "",
      company: "",
      location: "",
      slug: ""
    };

    // Slug from URL
    data.slug = data.url.replace("https://www.linkedin.com/in/","").replace(/\//g,"");

    // ── NAME ────────────────────────────────────────────────
    var nameEl = trySelectors([
      "h1.text-heading-xlarge",
      "h1.inline.t-24",
      "h1[class*='text-heading']",
      ".pv-top-card .text-heading-xlarge",
      ".ph5 h1",
      "main h1",
      "h1"
    ]);
    if (nameEl) {
      var fullName = txt(nameEl);
      // Remove LinkedIn badges like " 1st" " 2nd" " 3rd"
      fullName = fullName.replace(/\s+(1st|2nd|3rd)$/,"");
      var parts = fullName.split(/\s+/);
      data.firstName = parts[0] || "";
      data.lastName = parts.slice(1).join(" ") || "";
    }

    // ── HEADLINE ────────────────────────────────────────────
    var headlineEl = trySelectors([
      ".text-body-medium.break-words",
      "div.text-body-medium",
      ".pv-top-card h2 + div",
      ".ph5 .text-body-medium",
      "main section:first-of-type div.text-body-medium"
    ]);
    if (headlineEl) {
      data.headline = txt(headlineEl);
    }

    // ── LOCATION ────────────────────────────────────────────
    var locEl = trySelectors([
      ".text-body-small.inline.t-black--light.break-words",
      "span.text-body-small.inline.t-black--light",
      ".pv-top-card--list-bullet li:first-child",
      ".ph5 .text-body-small.t-black--light",
      "main section:first-of-type span.text-body-small"
    ]);
    if (locEl) {
      data.location = txt(locEl);
    }

    // ── CURRENT POSITION (experience section) ───────────────
    var gotExp = false;

    // Strategy 1: experience section items
    var expSection = q("#experience") || q("section:has(#experience)");
    var expItems = [];
    if (expSection) {
      expItems = qAll("#experience ~ .pvs-list__outer-container li.artdeco-list__item");
      if (!expItems.length) {
        expItems = Array.from(expSection.closest("section").querySelectorAll("li.artdeco-list__item"));
      }
    }
    // Strategy 2: broader selectors
    if (!expItems.length) {
      expItems = qAll("section[id='experience'] li.artdeco-list__item");
    }
    if (!expItems.length) {
      expItems = qAll("div[id='experience'] ~ div li.artdeco-list__item");
    }

    if (expItems.length) {
      var first = expItems[0];
      // Title: usually first bold span with aria-hidden
      var titleEl = first.querySelector(".t-bold span[aria-hidden='true']")
        || first.querySelector(".mr1.t-bold span")
        || first.querySelector("span.t-bold span[aria-hidden='true']")
        || first.querySelector("div[class*='t-bold'] span");
      // Company: normal weight span
      var compEl = first.querySelector(".t-normal:not(.t-black--light) span[aria-hidden='true']")
        || first.querySelector(".t-14.t-normal span[aria-hidden='true']")
        || first.querySelector("span.t-14.t-normal:not(.t-black--light) span");

      if (titleEl) { data.jobTitle = txt(titleEl); gotExp = true; }
      if (compEl) {
        var compText = txt(compEl);
        // Remove "· Full-time" "· CDI" etc
        data.company = compText.split("·")[0].trim();
      }
    }

    // Strategy 3: top card company link/button
    if (!data.company) {
      var companyLink = trySelectors([
        "button[aria-label*='company'] span",
        "button[aria-label*='Current company'] span",
        ".pv-top-card--experience-list-item span",
        ".pv-top-card__experience-list-item",
        "a[data-field='experience_company_logo'] + div span"
      ]);
      if (companyLink) {
        data.company = txt(companyLink);
      }
    }

    // Strategy 4: parse headline for title/company if we don't have them
    if (!gotExp && data.headline) {
      var separators = /\s+(?:at|@|chez|·|\||–|-|—|,)\s+/i;
      var hParts = data.headline.split(separators);
      if (hParts.length >= 2) {
        data.jobTitle = hParts[0].trim();
        if (!data.company) data.company = hParts[1].trim();
      } else {
        data.jobTitle = data.headline;
      }
    }

    // Fallback: if still no jobTitle, use headline
    if (!data.jobTitle && data.headline) {
      data.jobTitle = data.headline;
    }

    return data;
  }

  /* ── message listener ────────────────────────────────────── */
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "extractProfile") {
      var data = extractProfile();
      sendResponse(data);
    }
    return true;
  });

})();
