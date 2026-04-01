module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  var token = process.env.NOTION_TOKEN;
  if (!token) return res.status(500).json({ error: "NOTION_TOKEN manquant dans les variables Vercel" });

  try {
    // GET: endpoint in query param
    // POST: endpoint + body in JSON body
    var endpoint, body, method;

    if (req.method === "GET") {
      endpoint = req.query.endpoint;
      method = "GET";
      body = undefined;
    } else {
      var parsed = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      endpoint = parsed.endpoint;
      // Allow frontend to specify GET via method field (e.g. for reading blocks)
      if (parsed.method === "GET") {
        method = "GET";
        body = undefined;
      } else {
        body = parsed.body ? JSON.stringify(parsed.body) : "{}";
        method = "POST";
      }
    }

    if (!endpoint) return res.status(400).json({ error: "Endpoint manquant" });

    var url = "https://api.notion.com/v1/" + endpoint;
    var fetchRes = await fetch(url, {
      method: method,
      headers: {
        "Authorization": "Bearer " + token,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json"
      },
      body: method === "POST" ? body : undefined
    });

    var text = await fetchRes.text();
    var data;
    try { data = JSON.parse(text); } catch (e) { data = { raw: text }; }
    return res.status(fetchRes.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
