// EarlybirdTalent — Background Service Worker
// Proxifie les appels API depuis le content script
// (les content scripts sont soumis au CORS de la page ; le service worker ne l'est pas)

var API_BASE = "https://earlybird-talent.vercel.app";

chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {

  // ── Ajout d'un candidat ──────────────────────────────────────────────
  if (msg.type === "ADD_CANDIDATE") {
    var controller = new AbortController();
    var timeout = setTimeout(function() {
      controller.abort();
    }, 10000); // 10s timeout

    fetch(API_BASE + "/api/add-candidate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(msg.payload),
      signal: controller.signal
    })
    .then(function(r) {
      clearTimeout(timeout);
      return r.json();
    })
    .then(function(data) {
      sendResponse({ ok: true, data: data });
    })
    .catch(function(e) {
      clearTimeout(timeout);
      sendResponse({ ok: false, error: e.name === "AbortError" ? "Timeout (10s) — Vercel ne répond pas" : e.message });
    });

    return true; // Garder le canal ouvert pour la réponse async
  }

  // ── Batch capture Sales Nav ──────────────────────────────────────────
  if (msg.type === "ADD_CANDIDATE_BATCH") {
    var candidates = msg.payload || [];
    var results = [];
    var idx = 0;

    function next() {
      if (idx >= candidates.length) {
        sendResponse({ ok: true, results: results });
        return;
      }
      var candidate = candidates[idx++];
      fetch(API_BASE + "/api/add-candidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(candidate)
      })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        results.push({ name: candidate.firstName + " " + candidate.lastName, ok: !data.error, error: data.error || null });
        next();
      })
      .catch(function(e) {
        results.push({ name: candidate.firstName + " " + candidate.lastName, ok: false, error: e.message });
        next();
      });
    }

    next();
    return true; // Async
  }

});
