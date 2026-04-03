// EarlybirdTalent Extension — Classification Framework
// Mirrors the 11 role families + seniority logic from the main app

var ROLE_KEYWORDS = {
  "account executive":   "Bottom of funnel",
  "ae":                  "Bottom of funnel",
  "commercial":          "Bottom of funnel",
  "inside sales":        "Bottom of funnel",
  "new business":        "Bottom of funnel",
  "closing":             "Bottom of funnel",
  "sales executive":     "Bottom of funnel",
  "full cycle":          "Bottom of funnel",
  "chargé de clientèle": "Bottom of funnel",
  "business developer":  "Bottom of funnel",

  "sdr":                    "Top of funnel",
  "bdr":                    "Top of funnel",
  "sales development":      "Top of funnel",
  "outbound":               "Top of funnel",
  "prospection":            "Top of funnel",
  "business development rep":"Top of funnel",

  "csm":              "CSM",
  "customer success":  "CSM",
  "client success":    "CSM",
  "onboarding":        "CSM",

  "account manager":   "Farmer",
  "key account":       "Farmer",
  "kam":               "Farmer",
  "renouvellement":    "Farmer",

  "ops":               "Ops",
  "operations":        "Ops",
  "revenue ops":       "Ops",

  "chief of staff":    "CoS/FA",
  "cos":               "CoS/FA",
  "founder associate": "CoS/FA",
  "bras droit":        "CoS/FA",

  "growth":            "Growth/Marketing",
  "marketing":         "Growth/Marketing",
  "demand gen":        "Growth/Marketing",

  "partnerships":      "Partnerships",
  "partenariats":      "Partnerships",
  "channel":           "Partnerships",
  "alliances":         "Partnerships",

  "revops":            "RevOps",
  "sales ops":         "RevOps",

  "pre-sales":         "Pre-Sales",
  "presales":          "Pre-Sales",
  "solution engineer": "Pre-Sales",
  "solutions consultant":"Pre-Sales",

  "sales manager":        "Sales Manager",
  "head of sales":        "Sales Manager",
  "directeur commercial": "Sales Manager",
  "vp sales":             "Sales Manager",
  "sales director":       "Sales Manager",
  "country manager":      "Sales Manager"
};

// Short labels for pills
var RF_SHORT = {
  "Bottom of funnel":"AE",
  "Top of funnel":"SDR",
  "CSM":"CSM",
  "Farmer":"AM",
  "Ops":"Ops",
  "CoS/FA":"CoS",
  "Growth/Marketing":"Growth",
  "Partnerships":"Partners",
  "Pre-Sales":"PreSales",
  "RevOps":"RevOps",
  "Sales Manager":"Sales Mgr"
};

var ALL_ROLES = [
  "Bottom of funnel","Top of funnel","CSM","Farmer","Ops",
  "CoS/FA","Growth/Marketing","Partnerships","RevOps","Pre-Sales","Sales Manager"
];

// Seniority keywords
// Use regex word boundaries to avoid partial matches (e.g. "cco" in "account")
var SN_SENIOR_RE = /\b(senior|sr\.?|lead|principal|director|directeur|vp|chief|c-level|cro|cco|cso)\b/i;
var SN_JUNIOR_RE = /\b(junior|jr\.?|stage|stagiaire|intern|apprenti|alternant|alternance)\b/i;

/**
 * Classify a job title into { role, seniority, roleShort }
 */
function classifyTitle(title) {
  var result = { role: null, seniority: "Mid", roleShort: null };
  if (!title) return result;

  var lower = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Match role — longest keyword match wins
  var bestMatch = null;
  var bestLen = 0;
  for (var kw in ROLE_KEYWORDS) {
    if (lower.includes(kw) && kw.length > bestLen) {
      bestMatch = ROLE_KEYWORDS[kw];
      bestLen = kw.length;
    }
  }
  result.role = bestMatch;
  result.roleShort = bestMatch ? (RF_SHORT[bestMatch] || bestMatch) : null;

  // Seniority from title keywords (regex with word boundaries)
  if (SN_SENIOR_RE.test(title)) {
    result.seniority = "Senior";
  } else if (SN_JUNIOR_RE.test(title)) {
    result.seniority = "Junior";
  }

  // Head/VP/Director level = always Senior (use word boundaries to avoid matching "head" inside "headline")
  if (/\b(head of|vp |vice.?president|director|directeur|chief of staff|cro|cco)\b/i.test(title)) {
    result.seniority = "Senior";
  }

  return result;
}
