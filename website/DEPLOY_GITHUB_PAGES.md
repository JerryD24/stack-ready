# Deploy StackReady on GitHub Pages (Free)

Host **StackReady** for free at `https://<username>.github.io/stack-ready/`.

**Recommended repo name:** `stack-ready`

---

## Step 1 — Create public GitHub repository

1. Go to [github.com/new](https://github.com/new)
2. Repository name: **`stack-ready`**
3. **Public** (required for free Pages on personal accounts)
4. Create repository (no README if pushing existing folder)

---

## Step 2 — Prepare files for static hosting

```bash
cd Interview_Prep/website
node prepare-deploy.js stack-ready
```

This copies all `.md` / `.txt` guides into `website/content/` and sets `config.js` → `basePath: '/stack-ready'`.

---

## Step 3 — Push to GitHub

Push only the `Interview_Prep` folder (never client/work code):

```bash
cd Interview_Prep
git init
git add .
git commit -m "StackReady: interview prep guides and web UI"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/stack-ready.git
git push -u origin main
```

---

## Step 4 — Enable GitHub Pages

1. Repo → **Settings** → **Pages**
2. **Source**: Deploy from a branch
3. **Branch**: `main` | **Folder**: `/website`
4. Save

Live URL (after 1–3 min):

```
https://YOUR_USERNAME.github.io/stack-ready/
```

---

## After updating guides

```bash
cd Interview_Prep/website
node prepare-deploy.js stack-ready
git add .
git commit -m "Update study guides"
git push
```

---

## Can your AI agent deploy for you?

Yes — if you:

1. Create the empty public repo `stack-ready` on GitHub
2. Share the repo URL (e.g. `https://github.com/yourusername/stack-ready`)
3. Have **Git** and **GitHub CLI (`gh`)** logged in on your machine (`gh auth login`)

Then the agent can run `prepare-deploy.js`, commit, push, and you enable Pages in Settings (one click — GitHub UI only).

The agent **cannot** enable Pages or create the repo without your GitHub account access.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Blank page | Run `node prepare-deploy.js stack-ready`; hard refresh |
| Markdown 404 | Ensure `website/content/` has files |
| Wrong asset paths | `config.js` must have `basePath: '/stack-ready'` |

---

## Private backup repo

Keep a **private** repo with the same `Interview_Prep` files for your backup. The **public** `stack-ready` repo is only for the free website (no client code).
