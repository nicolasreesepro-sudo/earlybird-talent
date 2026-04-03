// EarlybirdTalent Content Script — runs on LinkedIn profile pages
// Extracts candidate data from the visible page and sends to popup

(function() {
  function extractProfile() {
    var data = {
      url: window.location.href.split("?")[0].replace(/\/$/,""),
      firstName: "",
      lastName: "",
      headline: "",
      jobTitle: "",
      company: "",
      location: ""
    };

    // URL slug as ID
    var slug = data.url.replace("https://www.linkedin.com/in/","").replace(/\//g,"");
    data.slug = slug;

    // Name — from the main h1
    var nameEl = document.querySelector("h1.text-heading-xlarge")
      || document.querySelector("h1.inline.t-24")
      || document.querySelector(".pv-top-card--list li:first-child");
    if(nameEl) {
      var parts = nameEl.textContent.trim().split(/\s+/);
      data.firstName = parts[0] || "";
      data.lastName = parts.slice(1).join(" ") || "";
    }

    // Headline — subtitle under name
    var headlineEl = document.querySelector(".text-body-medium.break-words")
      || document.querySelector(".pv-top-card--list.pv-top-card--list-bullet + div");
    if(headlineEl) {
      data.headline = headlineEl.textContent.trim();
    }

    // Current position — from experience section or top card
    var topSubline = document.querySelector(".pv-text-details__right-panel-item-text")
      || document.querySelector("div.inline-show-more-text");

    // Try experience section for more detail
    var expItems = document.querySelectorAll("#experience ~ .pvs-list__outer-container li.artdeco-list__item");
    if(expItems.length === 0) {
      expItems = document.querySelectorAll("section[id='experience'] li.artdeco-list__item");
    }
    if(expItems.length === 0) {
      // Fallback: try the top card company button
      var companyLink = document.querySelector("button[aria-label*='Current company'] span")
        || document.querySelector(".pv-top-card--experience-list-item span");
      if(companyLink) {
        data.company = companyLink.textContent.trim();
      }
      // Parse headline for title
      if(data.headline) {
        var hParts = data.headline.split(/\s+(?:at|@|chez|·|\|)\s+/i);
        if(hParts.length >= 2) {
          data.jobTitle = hParts[0].trim();
          if(!data.company) data.company = hParts[1].trim();
        } else {
          data.jobTitle = data.headline;
        }
      }
    } else {
      // First experience item = current role
      var firstExp = expItems[0];
      var titleEl = firstExp.querySelector(".t-bold span[aria-hidden='true']")
        || firstExp.querySelector(".mr1.t-bold span");
      var compEl = firstExp.querySelector(".t-normal:not(.t-black--light) span[aria-hidden='true']")
        || firstExp.querySelector(".t-14.t-normal span");
      if(titleEl) data.jobTitle = titleEl.textContent.trim();
      if(compEl) {
        var compText = compEl.textContent.trim();
        // Remove "· Full-time" etc
        data.company = compText.split("·")[0].trim();
      }
    }

    // Location
    var locEl = document.querySelector(".text-body-small.inline.t-black--light.break-words")
      || document.querySelector(".pv-top-card--list.pv-top-card--list-bullet li:first-child");
    if(locEl) {
      data.location = locEl.textContent.trim();
    }

    return data;
  }

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if(request.action === "extractProfile") {
      var data = extractProfile();
      sendResponse(data);
    }
    return true; // keep channel open for async
  });
})();
