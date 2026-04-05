# PROMPT POUR SONNET — Roadmap EarlybirdTalent

## CONTEXTE GLOBAL

Tu travailles sur EarlybirdTalent, un outil interne de base de données candidats pour Nicolas, recruteur GTM solo (Pre-Seed → Series A, Paris). C'est un fichier HTML unique (~2000 lignes) déployé sur Vercel (earlybird-talent.vercel.app) avec du JS embarqué.

### Architecture actuelle
- `index.html` : tout le frontend (CSS + JS + data) — environ 2000 lignes
- `api/notion.js` : proxy Notion API (NOTION_TOKEN en env var)
- `api/claude.js` : proxy Anthropic API (ANTHROPIC_KEY en env var)
- `api/add-candidate.js` : endpoint pour ajouter un candidat depuis l'extension Chrome
- `extension/` : extension Chrome Manifest V3 pour capturer des profils LinkedIn
- `vercel.json` : config routes + timeouts
- Données candidats : tableau `ALL` en dur dans index.html (ligne ~913), ~5000 entrées
- Données entreprises : objet `COMPANY_DB` en dur (ligne ~914)
- Données enrichies : objet `xtr` chargé depuis `window.storage` (notes, lastContact, notionSync)
- Mot de passe : `Nhresr892701?` (sessionStorage)
- Notion DB ID : `33577a179998805699abf7c1221b49ed`

### Règles CLAUDE.md (OBLIGATOIRES)
1. Lire CLAUDE.md avant toute tâche
2. Toujours demander confirmation avant de supprimer ou écraser un fichier
3. Faire un backup avant toute modification de index.html
4. Ne jamais modifier les fichiers dans /api/ sans demander
5. Toujours tester/valider le JS avant de livrer
6. Répondre en français

### Contrainte technique critique
- index.html fait ~520k tokens — trop gros pour le Read tool
- Utiliser `sed`, `grep`, ou Python pour lire/modifier des sections spécifiques
- Après chaque modification JS, valider avec : `node -e "new Function(code)"`
- Vérifier la structure HTML : compter les `<style>`, `<script>`, `</body>` tags

---

## LES 5 TÂCHES À EXÉCUTER (dans l'ordre)

---

### TÂCHE 1 — Fermer la boucle capture → app

**Problème** : Les candidats ajoutés via l'extension Chrome vont dans Notion mais n'apparaissent JAMAIS dans le tableau `ALL` de l'app. Nicolas doit manuellement re-exporter, re-coller le JSON, et re-déployer. C'est cassé.

**Solution** : Créer un endpoint `/api/candidates.js` qui lit les candidats depuis Notion et les merge avec le tableau `ALL` existant.

**Étapes** :
1. Créer `/api/candidates.js` — endpoint serverless qui :
   - Query la base Notion (DB ID: `33577a179998805699abf7c1221b49ed`) pour récupérer les candidats ajoutés via l'extension (propriété `Source` = "Chrome Extension")
   - Retourne un JSON array au même format que `ALL` : `{ id, f, l, li, pj, rf, sn, hl, lo, co, jt, en, yrs, ind, nat, macro, size }`
   - Map les propriétés Notion vers le format `ALL` (First Name → f, Last Name → l, etc.)

2. Modifier `index.html` — au chargement de l'app, après que `ALL` est défini :
   - Fetch `/api/candidates` pour récupérer les nouveaux candidats
   - Merge dans `ALL` en évitant les doublons (vérifier par `slug` ou `id`)
   - Refresh le rendering après le merge
   - Afficher un discret compteur "X nouveaux candidats chargés"

3. Mettre à jour `vercel.json` — ajouter la route + timeout

**Validation** : Ajouter un candidat test via l'extension, recharger l'app, vérifier qu'il apparaît dans la recherche.

**⚠️ Demander permission à Nicolas avant de créer le fichier dans /api/**

---

### TÂCHE 2 — Page Projets

**Problème** : La page Projets est un stub vide (chercher "stub" ou "Projets" dans index.html). Nicolas assigne des candidats à des projets (champ `pj` sur chaque candidat) mais n'a aucune vue par projet.

**Solution** : Builder la page Projets avec un pipeline par projet.

**Étapes** :
1. Extraire la liste des projets depuis `ALL` — scanner tous les `c.pj` pour lister les projets uniques
2. Remplacer le stub Projets par une vraie page avec :
   - Liste des projets à gauche (sidebar) avec compteur de candidats
   - Clic sur un projet → affiche les candidats assignés à droite
   - Pour chaque candidat : nom, poste, entreprise, localisation, rôle family, séniorité, date dernier contact
   - Possibilité de cliquer pour ouvrir la modal candidat (même `openModal()` existante)
3. Ajouter un champ de recherche/filtre dans la page Projets
4. Le design doit suivre le style Superhuman/Arc existant (glassmorphism, gradients violets, etc.) — copier les patterns CSS des pages Search et Candidats

**Format des données projet** : Le champ `pj` est un array de strings sur chaque candidat. Ex: `["Pennylane AE", "Sales UK"]`. Un candidat peut être dans plusieurs projets.

**Validation** : La page affiche les projets, le compteur est correct, cliquer sur un candidat ouvre bien la modal.

---

### TÂCHE 3 — Capture batch depuis Sales Navigator

**Problème** : Nicolas utilise LinkedIn Sales Navigator pour sourcer. Aujourd'hui il capture les profils un par un avec l'extension. Il veut pouvoir capturer en masse depuis une page de résultats Sales Navigator.

**Solution** : Ajouter un mode "batch capture" dans l'extension Chrome (content.js).

**Étapes** :
1. Détecter si on est sur une page Sales Navigator (URL contient `linkedin.com/sales/search` ou `linkedin.com/sales/lists`)
2. Si oui, injecter un bouton flottant "Capturer X profils" en haut de la page
3. Au clic, scanner tous les cards de résultats visibles dans le DOM :
   - Extraire : nom, titre, entreprise, localisation depuis chaque card
   - Les cards Sales Nav ont une structure différente du profil standard — il faudra inspecter le DOM
4. Envoyer chaque candidat à `/api/add-candidate` en séquence (avec un délai de 200ms entre chaque pour éviter le rate limiting)
5. Afficher un compteur de progression : "12/47 capturés"
6. Détection de doublons via `chrome.storage.local`

**⚠️ Important** : Mettre à jour `manifest.json` pour ajouter les URLs Sales Navigator dans les `matches` et `host_permissions`.

**Validation** : Aller sur une recherche Sales Nav, cliquer le bouton, vérifier que les candidats sont envoyés à l'API et apparaissent dans l'app après reload.

---

### TÂCHE 4 — Préparation de call automatisée

**Problème** : Avant chaque call candidat, Nicolas prépare manuellement : relire ses notes, regarder le profil, préparer ses questions. C'est 10-15 min de prep par call.

**Solution** : Un bouton "Préparer le call" dans la modal candidat qui génère un brief via Claude API.

**Étapes** :
1. Ajouter un bouton "Préparer le call" dans la modal candidat (dans la fonction `openModal` de index.html, après la section enriched)
2. Au clic, collecter toutes les données du candidat :
   - Données de base (nom, poste, entreprise, localisation, role family, seniority)
   - Données enrichies (notes précédentes, données Notion sync si elles existent)
   - Données entreprise depuis `COMPANY_DB` (industrie, taille, nature)
3. Envoyer à `/api/claude` avec un prompt structuré :
```
Tu es l'assistant de Nicolas, recruteur GTM spécialisé Pre-Seed → Series A.
Prépare un brief de call pour ce candidat :

[données candidat]

Le brief doit contenir :
1. RÉSUMÉ PROFIL — 2-3 lignes sur qui est cette personne
2. POINTS À CREUSER — questions spécifiques basées sur ce qu'on sait et ce qui manque
3. DONNÉES MANQUANTES — ce qu'on n'a pas encore (salaire ? dispo ? motivation départ ? cycle de vente ?)
4. CONTEXTE ENTREPRISE — ce qu'on sait de sa boîte actuelle (si dans COMPANY_DB)
5. FIT POTENTIEL — si le candidat est assigné à un projet, évaluer le fit

Format : concis, bullet points, en français.
```
4. Afficher le résultat dans la modal, dans une section dépliable sous les données enrichies
5. Cacher le résultat quand on ferme la modal

**Validation** : Ouvrir un candidat enrichi avec des notes, cliquer "Préparer le call", vérifier que le brief est pertinent et s'affiche correctement.

---

### TÂCHE 5 — Capture audio post-call (notes vocales → données structurées)

**Problème** : Après un call, Nicolas tape ses notes dans Notion à la main, puis le sync Notion les extrait via Claude. Double saisie, perte de temps.

**Solution** : Un bouton "Dicter mes notes" dans la modal candidat qui enregistre l'audio, transcrit via l'API navigateur (Web Speech API), puis structure via Claude.

**Étapes** :
1. Ajouter un bouton micro "Dicter mes notes" dans la modal candidat (à côté du textarea notes)
2. Utiliser l'API Web Speech (navigator.mediaDevices + SpeechRecognition) — PAS besoin d'API externe pour la transcription basique
   - Fallback : si SpeechRecognition n'est pas dispo, utiliser MediaRecorder pour capturer l'audio, puis l'envoyer à un endpoint de transcription
3. Une fois la transcription obtenue, l'envoyer à `/api/claude` avec ce prompt :
```
Voici la transcription de notes vocales post-call d'un recruteur GTM.
Extrais les données structurées suivantes (null si non mentionné) :

- ranking (1 à 4, 4 = top)
- cycle_vente (ex: "6-12 mois", "SaaS mid-market")
- acv (average contract value)
- dispo (disponibilité)
- preavis (préavis)
- langues (array)
- package_actuel
- package_souhaite
- motivation_depart
- pros (array de points positifs)
- cons (array de points négatifs)
- dealbreakers
- notes_cles (résumé en 2-3 phrases)

Transcription :
[texte dicté]

Retourne un JSON valide uniquement.
```
4. Merger le résultat dans `xtr[candidatId].notionSync` et sauvegarder dans `window.storage`
5. Rafraîchir la section "Données extraites" de la modal

**Validation** : Ouvrir un candidat, cliquer le micro, dicter quelques notes de test ("Le candidat est dispo immédiatement, package actuel 55k fixe + 10k variable, il veut 65 fixe minimum, très motivé pour du early stage SaaS"), vérifier que les données sont extraites et affichées.

---

## NOTES IMPORTANTES POUR SONNET

### Comment modifier index.html
Le fichier est trop gros pour Read. Utilise cette approche :
```bash
# Lire une section
sed -n '1240,1290p' index.html

# Trouver une fonction
grep -n "function openModal" index.html

# Insérer du code après une ligne
sed -i '1290a\  // nouveau code ici' index.html

# Ou utiliser Python pour des modifications plus complexes
python3 << 'EOF'
import re
with open('index.html','r') as f: content = f.read()
# ... modifications ...
with open('index.html','w') as f: f.write(content)
EOF
```

### Comment valider le JS
```bash
# Extraire le JS du fichier et valider
sed -n '/<script>/,/<\/script>/p' index.html > /tmp/test.js
node -c /tmp/test.js
```

### Backup obligatoire
```bash
cp index.html index.backup-TACHE-N.html
```

### Style CSS existant
Le design suit un style Superhuman/Arc avec :
- Fond : `--bg: #F4F4F8` (light), gradients violets `#6C5CE7` → `#A78BFA`
- Glassmorphism : `backdrop-filter: blur(12px)`, `background: rgba(255,255,255,.6)`
- Border radius : 12px partout
- Tags/pills : 20px radius, couleurs selon le contexte
- Animations : transitions .2s ease, hover transforms
- Variables CSS définies en haut du `<style>`

### Framework de classification (pour la tâche 4)
11 familles de rôle : Bottom of funnel, Top of funnel, CSM, Farmer, Ops, CoS/FA, Growth/Marketing, Partnerships, RevOps, Pre-Sales, Sales Manager, Other
3 niveaux séniorité : Junior (0-2 ans), Mid (2-5 ans), Senior (5+ ans)
Map des raccourcis : `RF_SHORT` (ligne ~919)
