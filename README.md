# StackReady — Web UI

A responsive blue-themed website for browsing all interview prep markdown guides.

## Features

- **7 learning tracks** in a column layout: Java & Spring, System Design, DSA, Python, **Frontend React**, Cloud & Go, AI & MCP
- **Markdown reader** with syntax highlighting, table of contents, and section scroll-spy
- **Global search** across all topics
- **Progress tracking** — mark guides as read (localStorage)
- **Interactive checklist** on the roadmap (`00_Topic_List.md`)
- **12-week study plan** viewer
- **Responsive** — works on desktop, tablet, and mobile

## Quick Start

**Option A — Node.js (recommended on Windows):**

```bash
cd Interview_Prep/website
node server.js
```

**Option B — Python:**

```bash
cd Interview_Prep/website
python server.py
```

Open **http://localhost:8080** in your browser.

### Deploy to GitHub Pages (free)

See **[DEPLOY_GITHUB_PAGES.md](DEPLOY_GITHUB_PAGES.md)** for full steps. Quick version:

```bash
node prepare-deploy.js your-repo-name
git push
# GitHub → Settings → Pages → branch main, folder /website
```

> The site must be served over HTTP (not `file://`) so markdown files can be loaded via fetch.

Custom port:

```bash
python server.py 3000
```

## Structure

```
website/
├── index.html          # Dashboard with topic columns
├── reader.html         # Markdown viewer
├── server.py           # Local dev server
├── assets/
│   ├── css/styles.css  # Blue theme, responsive layout
│   └── js/
│       ├── topics.js   # Topic catalog & tracks
│       ├── app.js      # Dashboard logic
│       └── reader.js   # Markdown rendering
```

## Tracks

| Column | Guides |
|--------|--------|
| Java & Spring | Java Core, Spring Boot, Java CP Tricks |
| System Design | HLD, LLD, Python HLD/LLD, Notes |
| DSA | DSA, Python CP Tricks |
| Python | Python Core, FastAPI & Falcon |
| Cloud & Languages | AWS, Go |
| AI & MCP | AI Agents & MCP for Developers |

## MCP (Future)

This UI can be wrapped as an MCP resource server so AI tools can query your prep material. The markdown source files remain the single source of truth.

## GitHub Pages

For static hosting, deploy the `website/` folder and ensure markdown files are copied alongside or served from the same origin. The included `server.py` is for local development only.
