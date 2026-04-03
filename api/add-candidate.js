module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST uniquement" });

  var token = process.env.NOTION_TOKEN;
  if (!token) return res.status(500).json({ error: "NOTION_TOKEN manquant" });

  try {
    var body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    if (!body.firstName || !body.lastName) {
      return res.status(400).json({ error: "firstName et lastName requis" });
    }

    // DB ID for EarlybirdTalent candidates
    var DB_ID = "33577a179998805699abf7c1221b49ed";

    // Build Notion page properties
    var properties = {
      "Name": {
        title: [{
          text: { content: body.firstName + " " + body.lastName }
        }]
      }
    };

    // Optional rich text fields
    var textFields = {
      "First Name": body.firstName,
      "Last Name": body.lastName,
      "Job Title": body.jobTitle,
      "Company": body.company,
      "Location": body.location,
      "LinkedIn": body.linkedinUrl,
      "Role Family": body.roleFamily,
      "Seniority": body.seniority,
      "Headline": body.headline,
      "Source": "Chrome Extension"
    };

    for (var key in textFields) {
      if (textFields[key]) {
        properties[key] = {
          rich_text: [{
            text: { content: String(textFields[key]) }
          }]
        };
      }
    }

    // Project as multi-select if provided
    if (body.project) {
      properties["Projet"] = {
        multi_select: [{ name: body.project }]
      };
    }

    // Create page in Notion
    var notionRes = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + token,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        parent: { database_id: DB_ID },
        properties: properties
      })
    });

    var notionData = await notionRes.json();

    if (!notionRes.ok) {
      return res.status(notionRes.status).json({
        error: notionData.message || "Erreur Notion",
        details: notionData
      });
    }

    return res.status(200).json({
      success: true,
      pageId: notionData.id,
      name: body.firstName + " " + body.lastName
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
