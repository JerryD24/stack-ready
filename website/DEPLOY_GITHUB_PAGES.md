# Deploy StackReady on GitHub Pages (Free)

Live URL: **https://jerryd24.github.io/stack-ready/**

---

## Why you only see `/ (root)` and `/docs`

GitHub **branch-based** Pages only allows two folders:
- `/` (repository root)
- `/docs`

There is **no `/website` option** — that was incorrect in earlier docs. Sorry for the confusion.

StackReady uses **GitHub Actions** to deploy the `website/` folder instead.

---

## Enable GitHub Pages (correct way)

1. Open: [github.com/JerryD24/stack-ready/settings/pages](https://github.com/JerryD24/stack-ready/settings/pages)

2. Under **Build and deployment** → **Source**, select:

   ### **GitHub Actions**  ← choose this (NOT "Deploy from a branch")

3. Save. The workflow `Deploy StackReady to GitHub Pages` runs automatically.

4. Check progress: repo → **Actions** tab → latest workflow run

5. After it succeeds (~1–2 min), your site is live at:
   ```
   https://jerryd24.github.io/stack-ready/
   ```

---

## If "GitHub Actions" is not visible

1. Make sure the repo is **Public**
2. Go to **Settings** → **Actions** → **General** → allow Actions
3. Push the latest code (includes `.github/workflows/deploy-pages.yml`)
4. Return to **Settings** → **Pages** → Source: **GitHub Actions**

---

## How updates work

| You do | What happens |
|--------|----------------|
| Edit any `.md` file and `git push` | Action syncs content + deploys site |
| Edit `website/` files and push | Action deploys updated UI |

No manual `/docs` or `/website` folder selection needed.

---

## Alternative (if you prefer branch deploy)

Move the site into a `docs/` folder and select **Deploy from branch** → `main` → `/docs`.  
We use **GitHub Actions** so the folder can stay named `website/`.

---

## Local development

```bash
cd website
node server.js
```

Open http://localhost:8080
