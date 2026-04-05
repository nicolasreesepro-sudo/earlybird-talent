// /api/candidates.js
// Fetches candidates added via Chrome Extension from Notion
// and returns them in the same format as the ALL array in index.html

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "GET uniquement" });

  var token = process.env.NOTION_TOKEN;
  if (!token) return res.status(500).json({ error: "NOTION_TOKEN manquant" });

  var DB_ID = "33577a179998805699abf7c1221b49ed";

  try {
    var allCandidates = [];
    var startCursor = undefined;
    var hasMore = true;

    // Paginate through all results (Notion returns max 100 per request)
    while (hasMore) {
      var body = {
        filter: {
          property: "Source",
          rich_text: { equals: "Chrome Extension" }
        },
        sorts: [{ timestamp: "created_time", direction: "descending" }],
        page_size: 100
      };
      if (startCursor) body.start_cursor = startCursor;

      var notionRes = await fetch("https://api.notion.com/v1/databases/" + DB_ID + "/query", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + token,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      if (!notionRes.ok) {
        var err = await notionRes.json();
        return res.status(notionRes.status).json({ error: err.message || "Erreur Notion" });
      }

      var data = await notionRes.json();
      allCandidates = allCandidates.concat(data.results || []);
      hasMore = data.has_more || false;
      startCursor = data.next_cursor;
    }

    // Map Notion pages → ALL format
    var candidates = allCandidates.map(function(page) {
      var props = page.properties || {};

      function getText(prop) {
        if (!prop) return "";
        if (prop.rich_text && prop.rich_text.length) return prop.rich_text[0].plain_text || "";
        if (prop.title && prop.title.length) return prop.title[0].plain_text || "";
        return "";
      }

      function getMultiSelect(prop) {
        if (!prop || !prop.multi_select) return [];
        return prop.multi_select.map(function(s) { return s.name; });
      }

      var firstName  = getText(props["First Name"]);
      var lastName   = getText(props["Last Name"]);
      var linkedinUrl = getText(props["LinkedIn"]);
      var jobTitle   = getText(props["Job Title"]);
      var company    = getText(props["Company"]);
      var location   = getText(props["Location"]);
      var roleFamily = getText(props["Role Family"]);
      var seniority  = getText(props["Seniority"]);
      var headline   = getText(props["Headline"]);
      var projet     = getText(props["Projet"]);

      // Derive slug/id from LinkedIn URL or name
      var slug = linkedinUrl
        ? linkedinUrl.replace(/https?:\/\/(www\.)?linkedin\.com\/in\//,"").replace(/\/$/,"")
        : (firstName + "-" + lastName).toLowerCase().replace(/[^a-z0-9-]/g,"-");

      // Build pj array
      var pj = projet ? [projet] : [];

      return {
        id:    slug,
        f:     firstName,
        l:     lastName,
        li:    linkedinUrl || "",
        pj:    pj,
        rf:    roleFamily || "Other",
        sn:    seniority  || null,
        hl:    headline   || (jobTitle && company ? jobTitle + " @ " + company : ""),
        lo:    location   || "",
        co:    company    || "",
        jt:    jobTitle   || "",
        en:    true,
        yrs:   null,
        ind:   [],
        nat:   "",
        macro: "",
        size:  "",
        _source: "extension"   // marker to identify extension-captured candidates
      };
    }).filter(function(c) {
      return c.f && c.l; // require at least first + last name
    });

    return res.status(200).json({ candidates: candidates, total: candidates.length });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
