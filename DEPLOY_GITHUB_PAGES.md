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

## Enable GitHub Pages (use gh-pages branch)

After the first successful **Deploy StackReady to GitHub Pages** run:

1. Open: [github.com/JerryD24/stack-ready/settings/pages](https://github.com/JerryD24/stack-ready/settings/pages)

2. Under **Build and deployment** → **Source**, select:

   **Deploy from a branch**

3. Set:
   - **Branch:** `gh-pages`
   - **Folder:** `/ (root)`

4. Click **Save**

5. Live URL (1–2 min):
   ```
   https://jerryd24.github.io/stack-ready/
   ```

---

## What you see in Actions

| Workflow | Meaning |
|----------|---------|
| **Deploy StackReady to GitHub Pages** | Builds site → pushes to `gh-pages` branch |
| **Sync StackReady content** | Copies updated `.md` files into `website/content/` on `main` |

If **Deploy** shows red ❌ — click it → read the error log, then tell me the message.

**Re-run after fixing Pages settings:**
Actions → Deploy StackReady to GitHub Pages → **Re-run all jobs**

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
