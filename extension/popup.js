// EarlybirdTalent Extension — Popup Logic
// Communicates with content script, classifies, and sends to API

var API_BASE = "https://earlybird-talent.vercel.app";
var currentData = null;
var selectedRole = null; // manual override

// ── Init ─────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", function() {
  showLoading();
  extractFromTab();
  buildRoleTags();
});

function showLoading() {
  document.getElementById("loading").style.display = "block";
  document.getElementById("main").style.display = "none";
  document.getElementById("not-linkedin").style.display = "none";
}

function showNotLinkedIn() {
  document.getElementById("loading").style.display = "none";
  document.getElementById("main").style.display = "none";
  document.getElementById("not-linkedin").style.display = "block";
}

function showMain() {
  document.getElementById("loading").style.display = "none";
  document.getElementById("main").style.display = "block";
  document.getElementById("not-linkedin").style.display = "none";
}

// ── Extract profile from active tab ──────────────────────────────────
function extractFromTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    var tab = tabs[0];
    if (!tab || !tab.url || !tab.url.includes("linkedin.com/in/")) {
      showNotLinkedIn();
      return;
    }

    chrome.tabs.sendMessage(tab.id, { action: "extractProfile" }, function(data) {
      if (chrome.runtime.lastError || !data) {
        // Content script might not be injected yet — try scripting API
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["content.js"]
        }, function() {
          setTimeout(function() {
            chrome.tabs.sendMessage(tab.id, { action: "extractProfile" }, function(data2) {
              if (chrome.runtime.lastError || !data2) {
                showNotLinkedIn();
                return;
              }
              handleProfileData(data2);
            });
          }, 300);
        });
        return;
      }
      handleProfileData(data);
    });
  });
}

function handleProfileData(data) {
  currentData = data;

  // Fill form fields
  document.getElementById("f-first").value = data.firstName || "";
  document.getElementById("f-last").value = data.lastName || "";
  document.getElementById("f-title").value = data.jobTitle || data.headline || "";
  document.getElementById("f-company").value = data.company || "";
  document.getElementById("f-location").value = data.location || "";

  // Auto-classify
  runClassification();
  showMain();
}

// ── Classification ───────────────────────────────────────────────────
function runClassification() {
  var title = document.getElementById("f-title").value;
  var cl = classifyTitle(title);

  var roleEl = document.getElementById("cl-role");
  var snEl = document.getElementById("cl-sn");

  if (cl.role) {
    roleEl.textContent = cl.roleShort || cl.role;
    roleEl.title = cl.role;
    selectedRole = cl.role;
    highlightRoleTag(cl.role);
  } else {
    roleEl.textContent = "—";
    roleEl.title = "Non détecté";
    selectedRole = null;
  }

  snEl.textContent = cl.seniority;
}

// ── Role correction tags ─────────────────────────────────────────────
function buildRoleTags() {
  var container = document.getElementById("role-tags");
  ALL_ROLES.forEach(function(role) {
    var tag = document.createElement("span");
    tag.className = "tag-opt";
    tag.textContent = RF_SHORT[role] || role;
    tag.title = role;
    tag.dataset.role = role;
    tag.addEventListener("click", function() {
      selectedRole = role;
      document.getElementById("cl-role").textContent = RF_SHORT[role] || role;
      document.getElementById("cl-role").title = role;
      highlightRoleTag(role);
    });
    container.appendChild(tag);
  });
}

function highlightRoleTag(role) {
  var tags = document.querySelectorAll("#role-tags .tag-opt");
  tags.forEach(function(t) {
    t.classList.toggle("active", t.dataset.role === role);
  });
}

// ── Re-classify on title change ──────────────────────────────────────
document.addEventListener("DOMContentLoaded", function() {
  var titleInput = document.getElementById("f-title");
  var debounce = null;
  titleInput.addEventListener("input", function() {
    clearTimeout(debounce);
    debounce = setTimeout(function() { runClassification(); }, 400);
  });
});

// ── Add candidate ────────────────────────────────────────────────────
function addCandidate() {
  var btn = document.getElementById("btn-add");
  var status = document.getElementById("status");
  btn.disabled = true;
  status.className = "status";
  status.style.display = "none";

  var firstName = document.getElementById("f-first").value.trim();
  var lastName = document.getElementById("f-last").value.trim();

  if (!firstName || !lastName) {
    showStatus("err", "Prénom et nom requis");
    btn.disabled = false;
    return;
  }

  var candidate = {
    firstName: firstName,
    lastName: lastName,
    jobTitle: document.getElementById("f-title").value.trim(),
    company: document.getElementById("f-company").value.trim(),
    location: document.getElementById("f-location").value.trim(),
    roleFamily: selectedRole || null,
    seniority: document.getElementById("cl-sn").textContent || "Mid",
    project: document.getElementById("f-project").value.trim(),
    linkedinUrl: currentData ? currentData.url : "",
    slug: currentData ? currentData.slug : "",
    headline: currentData ? currentData.headline : "",
    capturedAt: new Date().toISOString()
  };

  // Check for duplicates in local storage
  chrome.storage.local.get(["captured"], function(result) {
    var captured = result.captured || [];
    var isDup = captured.some(function(c) {
      return c.slug && c.slug === candidate.slug;
    });

    if (isDup) {
      showStatus("dup", "Candidat déjà capturé !");
      btn.disabled = false;
      return;
    }

    // Send to API
    fetch(API_BASE + "/api/add-candidate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(candidate)
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (data.error) {
        showStatus("err", data.error);
        btn.disabled = false;
        return;
      }

      // Save locally to detect duplicates
      captured.push({
        slug: candidate.slug,
        name: firstName + " " + lastName,
        date: candidate.capturedAt
      });
      chrome.storage.local.set({ captured: captured });

      showStatus("ok", "Ajouté à la base !");
      btn.disabled = false;
    })
    .catch(function(err) {
      showStatus("err", "Erreur réseau : " + err.message);
      btn.disabled = false;
    });
  });
}

function showStatus(type, msg) {
  var el = document.getElementById("status");
  el.className = "status status-" + type;
  el.textContent = msg;
  el.style.display = "block";
}
