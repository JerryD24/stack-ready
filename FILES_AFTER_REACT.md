# StackReady — Files changed after React guide

Use this list to sync your **private** GitHub backup repo with local changes.

---

## New files (add these)

### Study guide
| File | Description |
|------|-------------|
| `15_React_JS_Complete_Guide.md` | Full React.js beginner → pro interview guide (22 sections) |

### Website — new since React
| File | Description |
|------|-------------|
| `website/config.js` | GitHub Pages base path (`/stack-ready`) |
| `website/.nojekyll` | Required for GitHub Pages |
| `website/prepare-deploy.js` | Copies guides → `website/content/` for deploy |
| `website/DEPLOY_GITHUB_PAGES.md` | StackReady deployment instructions |
| `website/assets/js/site.js` | Base URL helpers for local + GitHub Pages |

### Website content (generated — run `node prepare-deploy.js stack-ready`)
| Folder | Description |
|--------|-------------|
| `website/content/*.md` | 17 markdown copies for static hosting |
| `website/content/*.txt` | Study plan text copy |

**Content files (19 total):**
- `00_Topic_List.md`
- `00_Study_Plan_Day_by_Day.txt`
- `01_Java_Core_to_Advanced.md` through `15_React_JS_Complete_Guide.md`
- `Complete_PeerReview_Report.md`
- `System_Design_Notes.md`

---

## Modified files (update these)

| File | What changed |
|------|----------------|
| `00_Topic_List.md` | React file index, Section 6 checklist, StackReady website note |
| `website/index.html` | StackReady branding, config.js, 7 tracks stat |
| `website/reader.html` | StackReady branding, config.js + site.js |
| `website/README.md` | StackReady name, GitHub Pages section |
| `website/server.js` | Serves `website/content/` + parent guides |
| `website/assets/js/topics.js` | New **Frontend — React** track |
| `website/assets/js/app.js` | `siteUrl()` links for GitHub Pages |
| `website/assets/js/reader.js` | `contentUrl()`, StackReady title |

---

## Optional: regenerate content before commit

```bash
cd Interview_Prep/website
node prepare-deploy.js stack-ready
```

---

## Git add command (copy-paste)

From `Interview_Prep` folder:

```bash
git add 15_React_JS_Complete_Guide.md
git add 00_Topic_List.md
git add website/config.js website/.nojekyll website/prepare-deploy.js
git add website/DEPLOY_GITHUB_PAGES.md website/FILES_AFTER_REACT.md
git add website/assets/js/site.js
git add website/assets/js/topics.js website/assets/js/app.js website/assets/js/reader.js
git add website/index.html website/reader.html website/README.md website/server.js
git add website/content/
git commit -m "StackReady: React guide, GitHub Pages deploy, branding"
```

---

## Public vs private repo

| Repo | Purpose |
|------|---------|
| **Private** | Full backup of all `Interview_Prep` files (this list) |
| **Public `stack-ready`** | Same `Interview_Prep` folder for free GitHub Pages site |

Never add `acemigservice` or client work folders to either repo.
