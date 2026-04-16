// Endpoint temporaire de diagnostic — à supprimer après usage
module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  var token = process.env.NOTION_TOKEN;
  if (!token) return res.status(500).json({ error: "NOTION_TOKEN manquant" });

  var DB_ID = "33577a179998805699abf7c1221b49ed";

  try {
    var r = await fetch("https://api.notion.com/v1/databases/" + DB_ID, {
      headers: {
        "Authorization": "Bearer " + token,
        "Notion-Version": "2022-06-28"
      }
    });
    var data = await r.json();

    if (!r.ok) {
      return res.status(r.status).json({ error: data.message, code: data.code });
    }

    // Retourne le titre de la base + la liste des propriétés
    var dbTitle = (data.title && data.title[0]) ? data.title[0].plain_text : "(sans titre)";
    var properties = Object.entries(data.properties).map(function([name, prop]) {
      return { name: name, type: prop.type };
    });

    return res.status(200).json({
      database_title: dbTitle,
      database_id: DB_ID,
      properties: properties
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
