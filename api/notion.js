module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const token = process.env.NOTION_TOKEN;
  if (!token) return res.status(500).json({ error: "Token manquant" });

  // Support both ?endpoint=... and path after /api/notion/
  const url = require("url");
  const parsed = url.parse(req.url, true);
  const endpoint = parsed.query.endpoint ? decodeURIComponent(parsed.query.endpoint) : null;

  if (!endpoint) return res.status(400).json({ error: "Endpoint manquant", url: req.url });

  try {
    let body = undefined;
    if (req.method !== "GET") {
      if (typeof req.body === "string") {
        body = req.body;
      } else if (req.body && typeof req.body === "object") {
        body = JSON.stringify(req.body);
      } else {
        body = "{}";
      }
    }

    const notionRes = await fetch(`https://api.notion.com/v1/${endpoint}`, {
      method: req.method,
      headers: {
        "Authorization": `Bearer ${token}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: body,
    });

    const text = await notionRes.text();
    let data;
    try { data = JSON.parse(text); } catch(e) { data = { raw: text }; }
    return res.status(notionRes.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
