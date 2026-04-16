// EarlybirdTalent — injected sidebar for LinkedIn profiles + batch Sales Nav capture
// Auto-appears on linkedin.com/in/* pages, and sales nav search pages

(function() {

  var API_BASE = "https://earlybird-talent.vercel.app";
  var PANEL_ID = "eb-panel";
  var BATCH_BTN_ID = "eb-batch-btn";
  var selectedRole = null;
  var selectedSn   = null;
  var currentData  = null;

  // ── CSS (sidebar) ─────────────────────────────────────────────────
  var CSS = `
    #eb-panel {
      position: fixed; top: 80px; right: 0; width: 300px; z-index: 99999;
      font-family: 'Inter','Segoe UI',system-ui,sans-serif; font-size: 13px;
      background: #fff; border-radius: 12px 0 0 12px;
      box-shadow: -4px 0 24px rgba(0,0,0,.12); overflow: hidden;
      transition: transform .25s cubic-bezier(.4,0,.2,1);
    }
    #eb-panel.eb-hidden { transform: translateX(100%); }
    #eb-header {
      background: linear-gradient(135deg,#6C5CE7,#A78BFA);
      padding: 11px 14px; display: flex; align-items: center; justify-content: space-between;
    }
    #eb-header .eb-logo { font-weight: 800; font-size: 13px; color: #fff; letter-spacing: -.02em; }
    #eb-header .eb-logo em { font-style:normal; font-weight:400; font-size:10px; opacity:.8; margin-left:5px; }
    #eb-close {
      background: rgba(255,255,255,.2); border: none; border-radius: 6px;
      color: #fff; cursor: pointer; font-size: 14px; width:24px; height:24px;
      display:flex; align-items:center; justify-content:center; line-height:1;
    }
    #eb-close:hover { background: rgba(255,255,255,.35); }
    #eb-body { padding: 12px 14px; max-height: calc(100vh - 140px); overflow-y: auto; }
    .eb-field { margin-bottom: 9px; }
    .eb-label {
      font-size: 9px; font-weight: 700; letter-spacing: .08em;
      text-transform: uppercase; color: #9494A8; margin-bottom: 3px;
    }
    .eb-row { display: flex; gap: 6px; }
    .eb-input {
      width: 100%; padding: 6px 9px; border: 1px solid rgba(0,0,0,.09);
      border-radius: 7px; font-family: inherit; font-size: 12px;
      color: #111; background: #F7F7FB; outline: none; transition: border-color .15s;
    }
    .eb-input:focus { border-color: #6C5CE7; background: #fff; }
    .eb-divider { height: 1px; background: rgba(0,0,0,.06); margin: 10px 0; }
    .eb-pills { display: flex; gap: 5px; flex-wrap: wrap; }
    .eb-pill-role {
      padding: 3px 9px; border-radius: 20px; font-size: 10px; font-weight: 700;
      background: linear-gradient(135deg,#6C5CE7,#A78BFA); color: #fff;
    }
    .eb-pill-sn {
      padding: 3px 9px; border-radius: 20px; font-size: 10px; font-weight: 600;
      background: rgba(108,92,231,.08); color: #5B4BD5;
      border: 1px solid rgba(108,92,231,.16);
    }
    .eb-tags { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 4px; }
    .eb-tag {
      padding: 2px 8px; border-radius: 20px; font-size: 10px;
      border: 1px solid rgba(0,0,0,.08); background: #fff; color: #555;
      cursor: pointer; transition: all .12s;
    }
    .eb-tag:hover { border-color: rgba(108,92,231,.3); color: #5B4BD5; }
    .eb-tag.active { background: rgba(108,92,231,.08); border-color: rgba(108,92,231,.2); color: #5B4BD5; font-weight: 700; }
    .eb-btn {
      width: 100%; padding: 9px; border-radius: 9px; border: none;
      font-family: inherit; font-weight: 700; font-size: 13px; cursor: pointer;
      background: linear-gradient(135deg,#6C5CE7,#A78BFA); color: #fff;
      box-shadow: 0 2px 8px rgba(108,92,231,.25); transition: all .18s;
    }
    .eb-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(108,92,231,.35); }
    .eb-btn:disabled { opacity: .5; transform: none; box-shadow: none; cursor: not-allowed; }
    .eb-status {
      text-align: center; padding: 7px; border-radius: 7px;
      font-size: 11px; margin-top: 8px; display: none;
    }
    .eb-status.ok  { display:block; background:rgba(16,185,129,.08);  border:1px solid rgba(16,185,129,.16);  color:#10B981; }
    .eb-status.err { display:block; background:rgba(239,68,68,.08);   border:1px solid rgba(239,68,68,.16);   color:#EF4444; }
    .eb-status.dup { display:block; background:rgba(245,158,11,.08);  border:1px solid rgba(245,158,11,.16);  color:#F59E0B; }
    .eb-loading { text-align:center; padding:20px; color:#9494A8; font-size:11px; }
    .eb-spin {
      display:inline-block; width:16px; height:16px; margin-bottom:6px;
      border:2px solid rgba(0,0,0,.08); border-top-color:#6C5CE7;
      border-radius:50%; animation:eb-spin .6s linear infinite;
    }
    @keyframes eb-spin { to { transform: rotate(360deg); } }
  `;

  // ── CSS (batch capture) ───────────────────────────────────────────
  var BATCH_CSS = `
    #eb-batch-btn {
      position: fixed; top: 80px; right: 20px; z-index: 99999;
      background: linear-gradient(135deg,#6C5CE7,#A78BFA);
      color: #fff; font-weight: 700; font-size: 13px;
      padding: 10px 18px; border-radius: 22px; border: none;
      cursor: pointer; box-shadow: 0 4px 16px rgba(108,92,231,.35);
      font-family: 'Inter','Segoe UI',system-ui,sans-serif;
      transition: all .18s; display: flex; align-items: center; gap: 8px;
      white-space: nowrap;
    }
    #eb-batch-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 22px rgba(108,92,231,.45); }
    #eb-batch-btn:disabled { opacity: .6; transform: none; cursor: not-allowed; box-shadow: none; }
    #eb-batch-progress {
      position: fixed; top: 134px; right: 20px; z-index: 99999;
      background: #fff; border-radius: 12px; padding: 13px 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,.12);
      font-family: 'Inter','Segoe UI',system-ui,sans-serif;
      min-width: 220px; display: none;
    }
    #eb-batch-progress .eb-bp-title { font-weight: 700; font-size: 12px; margin-bottom: 8px; color: #111; }
    #eb-batch-progress .eb-bp-bar-bg {
      background: #F4F4F8; border-radius: 6px; height: 6px; overflow: hidden;
    }
    #eb-batch-progress .eb-bp-bar {
      background: linear-gradient(135deg,#6C5CE7,#A78BFA);
      height: 6px; border-radius: 6px; width: 0; transition: width .3s ease;
    }
    #eb-batch-progress .eb-bp-text { margin-top: 7px; color: #6C6C80; font-size: 11px; }
    #eb-batch-progress .eb-bp-done { color: #10B981; font-weight: 700; font-size: 11px; margin-top: 4px; }
  `;

  // ── HTML template (sidebar) ───────────────────────────────────────
  function buildHTML() {
    return `
      <div id="eb-header">
        <span class="eb-logo">EarlybirdTalent<em>Capture</em></span>
        <button id="eb-close" title="Fermer">✕</button>
      </div>
      <div id="eb-body">
        <div id="eb-loading" class="eb-loading">
          <div class="eb-spin"></div><br>Extraction du profil...
        </div>
        <div id="eb-main" style="display:none">
          <div class="eb-field">
            <div class="eb-label">Candidat</div>
            <div class="eb-row">
              <input class="eb-input" id="eb-first" placeholder="Prénom">
              <input class="eb-input" id="eb-last"  placeholder="Nom">
            </div>
          </div>
          <div class="eb-field">
            <div class="eb-label">Poste actuel</div>
            <input class="eb-input" id="eb-title" placeholder="Ex: Account Executive">
          </div>
          <div class="eb-field">
            <div class="eb-label">Entreprise</div>
            <input class="eb-input" id="eb-company" placeholder="Ex: Pennylane">
          </div>
          <div class="eb-field">
            <div class="eb-label">Localisation</div>
            <input class="eb-input" id="eb-location" placeholder="Ex: Paris, France">
          </div>
          <div class="eb-divider"></div>
          <div class="eb-field">
            <div class="eb-label">Classification auto</div>
            <div class="eb-pills">
              <span class="eb-pill-role" id="eb-cl-role">—</span>
              <span class="eb-pill-sn"   id="eb-cl-sn">—</span>
            </div>
          </div>
          <div class="eb-field">
            <div class="eb-label">Corriger le rôle</div>
            <div class="eb-tags" id="eb-role-tags"></div>
          </div>
          <div class="eb-field">
            <div class="eb-label">Séniorité</div>
            <div class="eb-tags" id="eb-sn-tags"></div>
          </div>
          <div class="eb-field">
            <div class="eb-label">Projet / Client (optionnel)</div>
            <input class="eb-input" id="eb-project" placeholder="Ex: Pennylane AE">
          </div>
          <div class="eb-divider"></div>
          <button class="eb-btn" id="eb-btn-add">Ajouter à la base</button>
          <div class="eb-status" id="eb-status"></div>
        </div>
      </div>
    `;
  }

  // ── Inject panel (profile mode) ───────────────────────────────────
  function injectPanel() {
    if (document.getElementById(PANEL_ID)) return;

    var style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);

    var panel = document.createElement("div");
    panel.id = PANEL_ID;
    panel.innerHTML = buildHTML();
    document.body.appendChild(panel);

    document.getElementById("eb-close").addEventListener("click", function() {
      panel.classList.add("eb-hidden");
    });

    document.getElementById("eb-btn-add").addEventListener("click", addCandidate);

    var debounce = null;
    document.getElementById("eb-title").addEventListener("input", function() {
      clearTimeout(debounce);
      debounce = setTimeout(runClassification, 400);
    });

    buildRoleTags();
    buildSnTags();
    extractAndFill();
  }

  // ── Extract profile ───────────────────────────────────────────────
  function clean(str) {
    return (str || "")
      .replace(/\|\|/g, "")
      .replace(/[\u2016\u2225]/g, "")
      .replace(/·\s*(1st|2nd|3rd)\b.*/i, "")
      .replace(/\s+/g, " ").trim();
  }

  function extractAndFill() {
    setTimeout(function() {
      var data = extractProfile();
      currentData = data;
      fillForm(data);
    }, 800);
  }

  function extractProfile() {
    var data = {
      url: window.location.href.split("?")[0].replace(/\/$/,""),
      firstName:"", lastName:"", headline:"",
      jobTitle:"", company:"", location:"", slug:""
    };
    data.slug = data.url.replace("https://www.linkedin.com/in/","").replace(/\//g,"");
    var main = document.querySelector("main") || document.body;

    // NAME — first meaningful heading in main
    var headings = main.querySelectorAll("h1,h2,h3");
    for (var i = 0; i < headings.length; i++) {
      var raw = (headings[i].textContent||"").replace(/\s+/g," ").trim();
      if (!raw || raw.length > 80 || raw.length < 3) continue;
      if (/^(Experience|Education|Skills|About|Activity|Highlights|Sales|Key|Interests)/i.test(raw)) continue;
      if (/^\d+$/.test(raw) || /notifications|messaging|jobs|home|network/i.test(raw)) continue;
      var fullName = clean(raw);
      var parts = fullName.split(/\s+/).filter(Boolean);
      if (parts.length < 2) continue;
      data.firstName = parts[0];
      data.lastName  = parts.slice(1).join(" ");
      break;
    }

    // HEADLINE — from page title
    var pageTitle = (document.title||"")
      .replace(/^\(\d+\)\s*/,"")
      .replace(/\|\|/g,"")
      .replace(/\s+/g," ").trim();
    var m = pageTitle.match(/^.+?\s*[-–—]\s*(.+?)\s*\|\s*LinkedIn$/i);
    if (m) data.headline = m[1].trim();

    // HEADLINE fallback — DOM scan
    if (!data.headline) {
      var firstSection = main.querySelector("section") || main;
      var spans = firstSection.querySelectorAll("div,span,p");
      var fullNameStr = (data.firstName+" "+data.lastName).toLowerCase();
      for (var i = 0; i < spans.length; i++) {
        if (spans[i].children.length > 3) continue;
        var t = (spans[i].textContent||"").replace(/\s+/g," ").trim();
        if (!t||t.length<8||t.length>200) continue;
        if (/contact info|followers|connections|connect|message|save|visit|500\+|1st|2nd|3rd/i.test(t)) continue;
        if (t.toLowerCase().startsWith(fullNameStr)) continue;
        if (/[@|chez]|founder|ceo|cto|coo|vp|director|manager|consultant|engineer|analyst|sales|account|growth|partner/i.test(t)) {
          data.headline = t; break;
        }
      }
    }

    // COMPANY — from Experience section first item
    var expSection = null;
    var allSections = main.querySelectorAll("section");
    for (var i = 0; i < allSections.length; i++) {
      var h = allSections[i].querySelector("h2,h3");
      if (h && /experience/i.test(h.textContent)) { expSection = allSections[i]; break; }
    }
    if (!expSection) {
      var expId = document.getElementById("experience");
      if (expId) expSection = expId.closest("section") || expId.parentElement;
    }
    if (expSection) {
      var expItems = expSection.querySelectorAll("li");
      if (expItems.length > 0) {
        var seen = {}; var texts = [];
        var allSpans = expItems[0].querySelectorAll("span");
        for (var i = 0; i < allSpans.length; i++) {
          if (allSpans[i].querySelector("span")) continue;
          var t = clean(allSpans[i].textContent);
          if (!t||t.length<2||t.length>80) continue;
          if (/permanent|full.?time|part.?time|freelance|remote|hybrid|présent|present|yr|mo|yrs|mos|\d{4}/i.test(t)) continue;
          if (seen[t]) continue;
          seen[t]=true; texts.push(t);
        }
        if (texts.length >= 2) data.company = texts[1].split("·")[0].trim();
        else if (texts.length === 1) data.company = texts[0].split("·")[0].trim();
      }
    }
    // Fallback company from headline
    if (!data.company && data.headline) {
      var hParts = data.headline.split(/\s+(?:@|chez|at)\s+|\s+of\s+/i);
      if (hParts.length >= 2) {
        data.company = hParts[1].replace(/\s*\(.*?\)\s*/g,"").split(/\s*[|·,]\s*/)[0].trim();
      }
    }

    // LOCATION — text matching geo patterns
    var firstSection2 = main.querySelector("section") || main;
    var nodes = firstSection2.querySelectorAll("span,div,p");
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].children.length > 2) continue;
      var t = (nodes[i].textContent||"").replace(/\s+/g," ").trim();
      if (!t||t.length<4||t.length>80) continue;
      if (/contact info|followers|connections|connect|message|save|visit/i.test(t)) continue;
      if (/France|Paris|Lyon|London|Berlin|Remote|Bordeaux|Lille|Marseille|Nantes|Toulouse|Strasbourg|Montpellier|United Kingdom|Germany|Spain|Belgique|Belgium|Suisse|Switzerland|Nederland|Hauts-de-France|Île-de-France|Ile-de-France|Auvergne|Occitanie|Bretagne|Normandie|Provence|Nouvelle-Aquitaine|Grand Est|Pays de la Loire|Region|Area/i.test(t)) {
        data.location = t.replace(/\s*[·•]\s*Contact info.*/i,"").trim();
        break;
      }
    }

    // JOB TITLE from headline
    if (data.headline) {
      var p = data.headline.split(/\s+(?:@|chez|at)\s+|\s+of\s+|\s*[|·]\s*/i);
      data.jobTitle = p[0].trim() || data.headline;
    }

    console.log("[EarlybirdTalent]", JSON.stringify(data));
    return data;
  }

  // ── Fill form ─────────────────────────────────────────────────────
  function fillForm(data) {
    document.getElementById("eb-first").value   = data.firstName || "";
    document.getElementById("eb-last").value    = data.lastName  || "";
    document.getElementById("eb-title").value   = data.jobTitle  || data.headline || "";
    document.getElementById("eb-company").value = data.company   || "";
    document.getElementById("eb-location").value= data.location  || "";
    document.getElementById("eb-loading").style.display = "none";
    document.getElementById("eb-main").style.display    = "block";
    runClassification();
  }

  // ── Classification ────────────────────────────────────────────────
  function runClassification() {
    var title = document.getElementById("eb-title").value;
    var cl = classifyTitle(title);
    document.getElementById("eb-cl-role").textContent = cl.roleShort || cl.role || "—";
    document.getElementById("eb-cl-role").title       = cl.role || "";
    document.getElementById("eb-cl-sn").textContent   = cl.seniority;
    selectedRole = cl.role;
    selectedSn   = cl.seniority;
    highlightRoleTag(cl.role);
    highlightSnTag(cl.seniority);
  }

  // ── Role tags ─────────────────────────────────────────────────────
  function buildRoleTags() {
    var c = document.getElementById("eb-role-tags");
    ALL_ROLES.forEach(function(role) {
      var tag = document.createElement("span");
      tag.className = "eb-tag"; tag.textContent = RF_SHORT[role]||role; tag.dataset.role = role;
      tag.addEventListener("click", function() {
        selectedRole = role;
        document.getElementById("eb-cl-role").textContent = RF_SHORT[role]||role;
        document.getElementById("eb-cl-role").title = role;
        highlightRoleTag(role);
      });
      c.appendChild(tag);
    });
  }
  function highlightRoleTag(role) {
    document.querySelectorAll("#eb-role-tags .eb-tag").forEach(function(t) {
      t.classList.toggle("active", t.dataset.role === role);
    });
  }

  // ── Seniority tags ────────────────────────────────────────────────
  function buildSnTags() {
    var c = document.getElementById("eb-sn-tags");
    ["Junior","Mid","Senior"].forEach(function(sn) {
      var tag = document.createElement("span");
      tag.className = "eb-tag"; tag.textContent = sn; tag.dataset.sn = sn;
      tag.addEventListener("click", function() {
        selectedSn = sn;
        document.getElementById("eb-cl-sn").textContent = sn;
        highlightSnTag(sn);
      });
      c.appendChild(tag);
    });
  }
  function highlightSnTag(sn) {
    document.querySelectorAll("#eb-sn-tags .eb-tag").forEach(function(t) {
      t.classList.toggle("active", t.dataset.sn === sn);
    });
  }

  // ── Add candidate (single) ────────────────────────────────────────
  function addCandidate() {
    var btn    = document.getElementById("eb-btn-add");
    var status = document.getElementById("eb-status");
    var first  = document.getElementById("eb-first").value.trim();
    var last   = document.getElementById("eb-last").value.trim();
    if (!first || !last) { showStatus("err","Prénom et nom requis"); return; }
    btn.disabled = true;
    if (status) { status.className = "eb-status"; status.style.display = "none"; }

    var candidate = {
      firstName:  first,
      lastName:   last,
      jobTitle:   document.getElementById("eb-title").value.trim(),
      company:    document.getElementById("eb-company").value.trim(),
      location:   document.getElementById("eb-location").value.trim(),
      roleFamily: selectedRole || null,
      seniority:  selectedSn  || "Mid",
      project:    document.getElementById("eb-project").value.trim(),
      linkedinUrl:currentData ? currentData.url  : window.location.href,
      slug:       currentData ? currentData.slug : "",
      headline:   currentData ? currentData.headline : "",
      capturedAt: new Date().toISOString()
    };

    function doFetch(captured) {
      fetch(API_BASE+"/api/add-candidate", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify(candidate)
      })
      .then(function(r){ return r.json(); })
      .then(function(data) {
        if (data.error) { showStatus("err", data.error); btn.disabled=false; return; }
        showStatus("ok","✓ Ajouté à la base !");
        btn.disabled=false;
        // Save to storage (best-effort)
        try {
          captured.push({ slug:candidate.slug, name:first+" "+last, date:candidate.capturedAt });
          chrome.storage.local.set({ captured:captured });
        } catch(e) {}
      })
      .catch(function(e){
        showStatus("err","Erreur réseau : "+e.message);
        btn.disabled=false;
      });
    }

    // Try storage dedup — with timeout fallback in case context is invalidated
    // (invalidated contexts don't always throw — they silently drop the callback)
    var storageCallbackFired = false;
    var storageFallbackTimer = setTimeout(function() {
      if (!storageCallbackFired) {
        console.log("[EB] Storage timeout — context probablement invalidé, envoi direct");
        doFetch([]);
      }
    }, 1500);

    try {
      // Quick check: if chrome.runtime.id is undefined, context is already dead
      if (!chrome.runtime || !chrome.runtime.id) {
        clearTimeout(storageFallbackTimer);
        doFetch([]);
        return;
      }
      chrome.storage.local.get(["captured"], function(result) {
        storageCallbackFired = true;
        clearTimeout(storageFallbackTimer);
        var captured = (result && result.captured) ? result.captured : [];
        if (candidate.slug && captured.some(function(c){ return c.slug===candidate.slug; })) {
          showStatus("dup","Candidat déjà capturé !"); btn.disabled=false; return;
        }
        doFetch(captured);
      });
    } catch(e) {
      storageCallbackFired = true;
      clearTimeout(storageFallbackTimer);
      console.log("[EB] Storage unavailable, envoi direct:", e.message);
      doFetch([]);
    }
  }

  function showStatus(type, msg) {
    var el = document.getElementById("eb-status");
    if (!el) return;
    el.className = "eb-status "+type; el.textContent = msg;
  }

  // ════════════════════════════════════════════════════════════════
  // ── SALES NAVIGATOR BATCH CAPTURE ────────────────────────────────
  // ════════════════════════════════════════════════════════════════

  function isSalesNav() {
    return /linkedin\.com\/sales\/(search|lists|lead-lists|people)/i.test(location.href);
  }

  // Count and return visible result cards on Sales Nav search page
  function getSalesNavCards() {
    // Sales Navigator uses multiple possible structures; try them in order
    var selectors = [
      "ol.artdeco-list > li",
      "ul.search-results__result-list > li",
      "[data-x-search-result]",
      ".search-results__result-container li",
      "li.artdeco-list__item"
    ];
    for (var i = 0; i < selectors.length; i++) {
      var found = document.querySelectorAll(selectors[i]);
      if (found.length > 2) return Array.from(found);
    }
    // Last resort: any li that contains an anchor to a Sales Nav lead
    var allLi = document.querySelectorAll("li");
    var leads = [];
    for (var i = 0; i < allLi.length; i++) {
      if (allLi[i].querySelector("a[href*='/sales/lead/']")) {
        leads.push(allLi[i]);
      }
    }
    return leads;
  }

  // Extract data from a single Sales Nav card
  function extractSalesNavCard(card) {
    var data = {
      firstName: "", lastName: "", jobTitle: "", company: "",
      location: "", linkedinUrl: "", slug: "", headline: "",
      capturedAt: new Date().toISOString()
    };

    // NAME — Sales Nav has data-anonymize attributes or specific elements
    var nameEl =
      card.querySelector("[data-anonymize='person-name']") ||
      card.querySelector(".result-lockup__name a") ||
      card.querySelector("a[href*='/sales/lead/'] span") ||
      card.querySelector("span[class*='name']");
    if (!nameEl) {
      // Try the first anchor that links to a lead profile
      nameEl = card.querySelector("a[href*='/sales/lead/']");
    }
    if (nameEl) {
      var rawName = (nameEl.textContent || "").replace(/\s+/g, " ").trim();
      // Remove degree indicators like "(2nd)" etc.
      rawName = rawName.replace(/\(?\d+(st|nd|rd|th)?\)?/gi, "").trim();
      var parts = rawName.split(/\s+/).filter(Boolean);
      data.firstName = parts[0] || "";
      data.lastName  = parts.slice(1).join(" ") || "";
    }

    // TITLE
    var titleEl =
      card.querySelector("[data-anonymize='job-title']") ||
      card.querySelector(".result-lockup__highlight-keyword") ||
      card.querySelector("span[class*='primary-subtitle']") ||
      card.querySelector(".result-lockup__position-company span:first-child");
    if (titleEl) {
      data.jobTitle = (titleEl.textContent || "").replace(/\s+/g, " ").trim();
    }

    // COMPANY
    var companyEl =
      card.querySelector("[data-anonymize='company-name']") ||
      card.querySelector("a[href*='/sales/company/']") ||
      card.querySelector(".result-lockup__position-company a");
    if (companyEl) {
      data.company = (companyEl.textContent || "").replace(/\s+/g, " ").trim();
    }

    // LOCATION
    var locEl =
      card.querySelector("[data-anonymize='location']") ||
      card.querySelector(".result-lockup__misc-item") ||
      card.querySelector("span[class*='location']");
    if (locEl) {
      data.location = (locEl.textContent || "").replace(/\s+/g, " ").trim();
    }

    // LINKEDIN URL — from Sales Nav lead URL (format: /sales/lead/XXXX,NAME,YYY)
    var linkEl =
      card.querySelector("a[href*='/sales/lead/']") ||
      card.querySelector("a[href*='/in/']");
    if (linkEl) {
      data.linkedinUrl = linkEl.href;
      // Extract slug: prefer /in/slug, fallback to name-based
      var m = data.linkedinUrl.match(/\/in\/([\w-]+)/);
      if (m) {
        data.slug = m[1];
      } else {
        // For Sales Nav URLs like /sales/lead/ACgAAAxxxx,NAME,YYYY
        // use first+last name as slug
        data.slug = (data.firstName + "-" + data.lastName)
          .toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
      }
    } else {
      data.slug = (data.firstName + "-" + data.lastName)
        .toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
    }

    // HEADLINE = jobTitle @ company
    data.headline = data.jobTitle + (data.company ? " @ " + data.company : "");

    return data;
  }

  // Inject batch capture button on Sales Nav pages
  function injectBatchButton() {
    if (document.getElementById(BATCH_BTN_ID)) return;

    var style = document.createElement("style");
    style.textContent = BATCH_CSS;
    document.head.appendChild(style);

    // Count cards
    var cards = getSalesNavCards();
    var count = cards.length;

    var btn = document.createElement("button");
    btn.id = BATCH_BTN_ID;
    btn.innerHTML = "🦅 Capturer " + (count > 0 ? count + " profil" + (count > 1 ? "s" : "") : "les profils");
    document.body.appendChild(btn);

    // Progress panel
    var prog = document.createElement("div");
    prog.id = "eb-batch-progress";
    prog.innerHTML =
      '<div class="eb-bp-title">Capture en cours…</div>' +
      '<div class="eb-bp-bar-bg"><div class="eb-bp-bar" id="eb-bp-bar"></div></div>' +
      '<div class="eb-bp-text" id="eb-bp-text">Initialisation…</div>' +
      '<div class="eb-bp-done" id="eb-bp-done" style="display:none"></div>';
    document.body.appendChild(prog);

    btn.addEventListener("click", function() {
      startBatchCapture();
    });

    // Update count if DOM changes (Sales Nav lazy-loads)
    var countObserver = new MutationObserver(function() {
      if (!document.getElementById(BATCH_BTN_ID)) { countObserver.disconnect(); return; }
      var c = getSalesNavCards().length;
      if (c > 0 && !btn.disabled) {
        btn.innerHTML = "🦅 Capturer " + c + " profil" + (c > 1 ? "s" : "");
      }
    });
    countObserver.observe(document.body, { childList: true, subtree: true });
  }

  function startBatchCapture() {
    var btn  = document.getElementById(BATCH_BTN_ID);
    var prog = document.getElementById("eb-batch-progress");
    var bar  = document.getElementById("eb-bp-bar");
    var text = document.getElementById("eb-bp-text");
    var done_el = document.getElementById("eb-bp-done");

    var cards = getSalesNavCards();
    if (!cards.length) {
      alert("Aucun profil détecté sur cette page. Les résultats sont peut-être en cours de chargement.");
      return;
    }

    btn.disabled = true;
    prog.style.display = "block";
    done_el.style.display = "none";

    var total   = cards.length;
    var added   = 0;
    var skipped = 0;

    chrome.storage.local.get(["captured"], function(result) {
      var captured = result.captured || [];
      var capturedSlugs = {};
      captured.forEach(function(c) { capturedSlugs[c.slug] = true; });

      function processCard(i) {
        if (i >= total) {
          // All done
          bar.style.width = "100%";
          text.textContent = total + " / " + total;
          done_el.style.display = "block";
          done_el.textContent = "✓ " + added + " ajouté" + (added > 1 ? "s" : "") +
            (skipped > 0 ? " · " + skipped + " ignoré" + (skipped > 1 ? "s" : "") : "");
          btn.disabled = false;
          btn.innerHTML = "✓ " + added + " capturé" + (added > 1 ? "s" : "");
          chrome.storage.local.set({ captured: captured });
          return;
        }

        var candidate = extractSalesNavCard(cards[i]);

        // Update progress bar
        var pct = Math.round((i / total) * 100);
        bar.style.width = pct + "%";
        text.textContent = (i + 1) + " / " + total +
          (candidate.firstName ? " — " + candidate.firstName + " " + candidate.lastName : "");

        // Skip if no name
        if (!candidate.firstName || !candidate.lastName) {
          skipped++;
          setTimeout(function() { processCard(i + 1); }, 50);
          return;
        }

        // Skip duplicates
        if (candidate.slug && capturedSlugs[candidate.slug]) {
          skipped++;
          setTimeout(function() { processCard(i + 1); }, 50);
          return;
        }

        // Classify
        if (typeof classifyTitle === "function" && candidate.jobTitle) {
          var cl = classifyTitle(candidate.jobTitle);
          candidate.roleFamily = cl.role;
          candidate.seniority  = cl.seniority;
        }

        // Send to API
        fetch(API_BASE + "/api/add-candidate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(candidate)
        })
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (!data.error) {
            added++;
            captured.push({
              slug: candidate.slug,
              name: candidate.firstName + " " + candidate.lastName,
              date: candidate.capturedAt
            });
            capturedSlugs[candidate.slug] = true;
          } else {
            skipped++;
          }
          setTimeout(function() { processCard(i + 1); }, 200);
        })
        .catch(function() {
          skipped++;
          setTimeout(function() { processCard(i + 1); }, 200);
        });
      }

      processCard(0);
    });
  }

  // ── SPA navigation detection ──────────────────────────────────────
  var lastUrl = location.href;
  var observer = new MutationObserver(function() {
    if (location.href !== lastUrl) {
      lastUrl = location.href;

      if (/linkedin\.com\/in\//i.test(location.href)) {
        // Profile page
        var panel = document.getElementById(PANEL_ID);
        if (panel) {
          panel.classList.remove("eb-hidden");
          var loadingEl = document.getElementById("eb-loading");
          var mainEl    = document.getElementById("eb-main");
          var statusEl  = document.getElementById("eb-status");
          if (loadingEl) loadingEl.style.display = "block";
          if (mainEl)    mainEl.style.display    = "none";
          if (statusEl)  { statusEl.className = "eb-status"; statusEl.style.display = "none"; }
          extractAndFill();
        } else {
          injectPanel();
        }
        // Remove batch button if present
        var bb = document.getElementById(BATCH_BTN_ID);
        if (bb) bb.remove();
        var bp = document.getElementById("eb-batch-progress");
        if (bp) bp.remove();

      } else if (isSalesNav()) {
        // Sales Nav search page
        var panel = document.getElementById(PANEL_ID);
        if (panel) panel.remove();
        setTimeout(function() { injectBatchButton(); }, 1500);
      }
    }
  });
  observer.observe(document, { subtree: true, childList: true });

  // ── Init ──────────────────────────────────────────────────────────
  function init() {
    if (/linkedin\.com\/in\//i.test(location.href)) {
      injectPanel();
    } else if (isSalesNav()) {
      // Wait a bit for results to load before counting
      setTimeout(injectBatchButton, 1500);
    }
  }

  if (document.body) {
    init();
  } else {
    document.addEventListener("DOMContentLoaded", init);
  }

  // Listen for messages from popup (backward compat)
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "extractProfile") {
      sendResponse(extractProfile());
    }
    return true;
  });

})();
