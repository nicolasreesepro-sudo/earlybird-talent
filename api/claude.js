module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  const key = process.env.ANTHROPIC_KEY;
  if (!key) return res.status(500).json({ error: "Clé manquante" });
  try {
    let body = typeof req.body === "object" ? JSON.stringify(req.body) : req.body || "{}";
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: body
    });
    const text = await r.text();
    let data; try { data = JSON.parse(text); } catch(e) { data = { error: text }; }
    return res.status(r.status).json(data);
  } catch(err) { return res.status(500).json({ error: err.message }); }
};
