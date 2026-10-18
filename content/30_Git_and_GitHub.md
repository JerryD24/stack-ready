# Git & GitHub — Complete Guide
### Version Control from First Principles to Production Workflows | Interview-Grade Depth

---

## TABLE OF CONTENTS
1. [What Is Git & GitHub](#1-what-is-git-github)
2. [How Git Works Internally](#2-how-git-works-internally)
3. [The Core Workflow](#3-the-core-workflow)
4. [Branching & Merging](#4-branching-merging)
5. [Merge vs Rebase](#5-merge-vs-rebase)
6. [Working With Remotes](#6-working-with-remotes)
7. [Undoing Changes](#7-undoing-changes)
8. [Stash, Cherry-pick & Tags](#8-stash-cherry-pick-tags)
9. [Resolving Merge Conflicts](#9-resolving-merge-conflicts)
10. [.gitignore & Tracking Files](#10-gitignore-tracking-files)
11. [GitHub Essentials](#11-github-essentials)
12. [Pull Requests & Code Review](#12-pull-requests-code-review)
13. [Branching Strategies](#13-branching-strategies)
14. [GitHub Actions (CI/CD)](#14-github-actions-cicd)
15. [Collaboration & Project Management](#15-collaboration-project-management)
16. [Best Practices & Common Mistakes](#16-best-practices-common-mistakes)
17. [Interview Q&A](#17-interview-qa)

---

## 1. What Is Git & GitHub

**Theory.** **Git** is a *distributed version control system* (DVCS): a tool that records snapshots of your project over time so you can review history, go back to any past state, and merge work from many people. "Distributed" is the key word — every clone is a **full copy** of the entire repository including its complete history, not just the latest files. **GitHub** is a *hosting platform* built on top of Git that adds collaboration features (pull requests, issues, code review, CI/CD, access control). Git is the engine; GitHub is one of several cars built around it (GitLab and Bitbucket are alternatives).

**Analogy.** Think of Git as the "save game" system for code, but instead of one save slot it keeps an unlimited, branching timeline of every save, who made it, and why. GitHub is the shared cloud where teammates' timelines meet.

**Why distributed matters.** In older centralized systems (SVN), there's one server holding history; if it's down you can't commit or view history. With Git, you commit, branch, diff, and view full history **offline** because it's all local. You only need the network to *share* (push/pull). This makes Git fast (most operations are local disk reads) and resilient (every clone is a backup).

**Centralized vs Distributed at a glance:**

| | Centralized (SVN) | Distributed (Git) |
|---|---|---|
| History location | Only on the server | On every clone |
| Commit offline | No | Yes |
| Branching cost | Expensive, discouraged | Cheap, encouraged |
| Single point of failure | The server | None (any clone restores it) |

**Interview angle.** A classic opener is "Git vs GitHub?" — Git is the version control tool you run locally; GitHub is a web service that hosts Git repositories and layers on collaboration. Saying "they're the same thing" is an instant red flag.

---

## 2. How Git Works Internally

**Theory.** Understanding Git's internals turns its commands from magic spells into obvious operations. At its core, Git is a **content-addressable key-value store**: you give it content, it stores it and hands you a key (a SHA-1/SHA-256 hash of the content). Everything in Git is one of four **object types**:

- **Blob** — the *contents* of a file (no filename, no metadata, just bytes).
- **Tree** — a directory listing: maps names → blobs (files) and other trees (subfolders).
- **Commit** — a snapshot pointer: references one top-level tree, plus author, message, timestamp, and **parent commit(s)**.
- **Tag** — a named, often annotated pointer to a specific commit (used for releases).

**How it works.** A commit is *not* a diff — it points to a complete tree (a full snapshot of the project at that moment). Git stays efficient because unchanged files reuse the **same blob hash** across commits (deduplication), and storage is later compressed into packfiles. Because each commit records its parent(s), the history forms a **DAG (Directed Acyclic Graph)** — a chain (or web, when branches merge) of commits pointing backward in time.

**The hash is the integrity guarantee.** A commit's hash is computed from its content *including its parent's hash*. Change anything in history and every downstream hash changes — which is why you can't silently alter a past commit, and why force-pushing rewritten history is so disruptive to others.

**The three areas every Git user must know:**

```
Working Directory      Staging Area (Index)        Repository (.git)
  (your files)   --->   (the next snapshot)  --->   (committed history)
              git add                  git commit
```

- **Working directory** — the actual files you edit on disk.
- **Staging area / index** — a "draft" of your next commit; `git add` moves changes here. This lets you commit *some* changes and leave others, crafting clean commits.
- **Repository** — the `.git` folder holding all objects and refs (the permanent history).

**Refs and HEAD.** A **branch** is simply a movable *pointer* (a 41-byte file) to a commit — that's why branching is instant and cheap. **HEAD** is a pointer to "where you are now" (usually the current branch). When you commit, the branch pointer advances to the new commit.

**Example.** You commit `file.txt`. Git stores a blob (its contents), a tree (root folder listing `file.txt → blob`), and a commit (pointing at the tree, with your message). You edit one line and commit again: a *new* blob, a *new* tree, a *new* commit whose parent is the first — but if you had a second unchanged file, its blob is reused, not copied.

**Interview angle.** "Is a commit a diff or a snapshot?" — a **snapshot** (Git shows diffs by comparing two snapshots on demand). "Why is branching cheap in Git?" — because a branch is just a pointer to a commit, not a copy of files.

---

## 3. The Core Workflow

**Theory.** Ninety percent of daily Git is a tight loop: change files → stage what you want → commit with a message → push to share. The staging step is what trips up newcomers, so internalize it: `git add` doesn't save anything permanently; it *selects* what your next commit will contain.

```bash
git init                 # create a new repo in the current folder
git clone <url>          # copy an existing remote repo (history + files)

git status               # what's changed, staged, untracked — run this constantly
git add file.txt         # stage one file
git add .                # stage everything changed in this folder down
git restore --staged f   # unstage (keep the edits, remove from next commit)

git commit -m "Add login validation"   # record staged changes as a snapshot
git commit -am "msg"     # stage + commit tracked files in one step (skips new files)

git log --oneline --graph --all   # compact, visual history
git diff                 # unstaged changes vs working dir
git diff --staged        # staged changes vs last commit
```

**How it works — file states.** A file is in one of these states, and `git status` tells you which:
- **Untracked** — Git has never seen it (new file). Needs `git add` to start tracking.
- **Modified** — tracked and changed but not staged.
- **Staged** — marked to go into the next commit.
- **Committed** — safely stored in history.

**Example — crafting a clean commit.** You fixed a bug *and* reformatted a file. Stage only the bug fix (`git add -p` lets you pick individual hunks), commit it as "Fix null check in parser", then stage and commit the formatting separately. Reviewers thank you because each commit does exactly one thing.

**Commit message convention (widely expected):** a short imperative summary ≤ ~50 chars, a blank line, then a body explaining *why*. Example: `Fix race condition in cache refresh` — not `fixed stuff`.

**Pitfall.** `git commit -am` only stages **already-tracked** files — brand-new files are silently left out. After adding new files, always `git status` before assuming everything is in.

**Interview angle.** "Difference between `git add` and `git commit`?" — `add` stages a change into the index (the draft of the next snapshot); `commit` permanently records the staged snapshot into history. The two-step design is intentional: it lets you build precise, reviewable commits.

---

## 4. Branching & Merging

**Theory.** A **branch** is an independent line of development — a movable pointer to a commit. You create one to work on a feature without disturbing the stable `main` branch, then **merge** it back when done. Because branches are just pointers, creating and switching them is near-instant.

```bash
git branch                       # list branches
git switch -c feature/login      # create + switch (modern; same as: git checkout -b)
git switch main                  # switch back
git branch -d feature/login      # delete a merged branch
git merge feature/login          # merge a branch into the current one
```

**How it works — two kinds of merge.**

1. **Fast-forward merge.** If `main` hasn't moved since you branched, merging just slides the `main` pointer forward to your feature's latest commit. No new commit is created — history stays linear.

```
Before:   main → A → B            (feature added C, D on top of B)
                    \
                     C → D ← feature
After ff: main ─────────► D       (main pointer just moved up)
```

2. **Three-way merge.** If *both* branches advanced (commits on `main` *and* on your feature), Git can't just slide the pointer. It finds the **common ancestor**, compares both tips against it, combines the changes, and creates a new **merge commit** with *two parents*.

```
        A → B → E        (main moved on: E)
             \       \
              C → D → M  (merge commit M has parents D and E)
```

**Example.** You branch `feature/cart` off `main` at commit B. A teammate merges a hotfix into `main` (commit E). When you merge your cart work back, Git performs a three-way merge of B→D (your work) and B→E (the hotfix), producing merge commit M containing both.

**Pitfall.** Long-lived branches drift far from `main` and create painful "big bang" merges. Keep branches short-lived (hours to a few days) and frequently update them from `main`.

**Interview angle.** "Fast-forward vs three-way merge?" — fast-forward when the target branch hasn't diverged (just moves the pointer, linear history); three-way when both diverged (creates a merge commit with two parents). Some teams force `--no-ff` to always create a merge commit so the feature's boundary is visible in history.

---

## 5. Merge vs Rebase

**Theory.** Both `merge` and `rebase` integrate changes from one branch into another, but they tell different *historical stories*. **Merge** preserves exactly what happened (including the branch shape) by creating a merge commit. **Rebase** rewrites your branch's commits so they appear to have been built on top of the latest target — producing a clean, linear history as if you'd started from the newest code.

```bash
# You're on feature, main has moved ahead
git merge main      # creates a merge commit, keeps both histories as-is
# OR
git rebase main     # replays your feature commits on top of main's tip
```

**How it works — rebase mechanics.** Rebase takes each of your branch's commits, sets them aside, moves your branch pointer to the target tip, and **re-applies your commits one by one** on top. Because each replayed commit has a new parent, it gets a **new hash** — these are *new* commits, not the originals. That's why rebasing shared history is dangerous: everyone else still has the old commits.

```
Merge result:                  Rebase result:
A → B → E  (main)              A → B → E → C' → D'  (linear)
     \       \
      C → D → M (feature)      (C,D rewritten as C',D' on top of E)
```

**The golden rule of rebase:** *Never rebase commits that others have already pulled.* Rebase your **local, unpushed** work to tidy it up; use merge for anything already shared.

**Interactive rebase** is a power tool for cleaning up local history before sharing:
```bash
git rebase -i HEAD~4    # squash, reorder, reword, or drop the last 4 commits
```
Common use: squash five "wip" commits into one meaningful commit before opening a pull request.

**Example.** You have messy local commits: "wip", "fix typo", "actually fix", "tests". Before pushing, `git rebase -i HEAD~4`, mark the last three as `squash`, and you ship one clean commit: "Add discount calculation with tests".

**Pitfall.** Rebasing a branch others are using, then force-pushing, makes their history diverge and causes duplicate commits/conflicts for the whole team. If you must force-push a rebased branch, use `--force-with-lease` (it refuses if someone else pushed in the meantime).

| | Merge | Rebase |
|---|---|---|
| History | Preserved, non-linear (merge commits) | Rewritten, linear |
| Commit hashes | Unchanged | Changed (new commits) |
| Safe on shared branches | Yes | No |
| Best for | Integrating finished work | Cleaning local history before sharing |

**Interview angle.** Expect "When would you rebase vs merge?" — Rebase local feature work onto the latest `main` to keep a clean, linear history and avoid noisy merge commits; merge when integrating a completed feature or anytime the commits are already shared. Always mention the golden rule.

---

## 6. Working With Remotes

**Theory.** A **remote** is a named reference to another copy of the repository, usually on a server like GitHub (the default name is `origin`). Your local branches and the remote's branches are *separate*; Git tracks the remote's state via **remote-tracking branches** like `origin/main`, which update only when you `fetch` or `pull`.

```bash
git remote -v                       # list remotes and URLs
git remote add origin <url>         # connect a local repo to a remote
git push -u origin main             # push and set upstream tracking
git fetch origin                    # download remote changes (does NOT touch your files)
git pull                            # fetch + merge (or rebase) into current branch
git clone <url>                     # create a local copy of a remote repo
```

**How it works — fetch vs pull (a key distinction).**
- **`git fetch`** downloads new commits and updates `origin/main`, but **leaves your working files and local `main` untouched**. It's the safe "show me what's new" command.
- **`git pull`** is `fetch` *plus* an immediate `merge` (default) or `rebase` (`git pull --rebase`) of those changes into your current branch — it changes your files.

**Example — the safe update habit.** Before integrating, run `git fetch` then `git log main..origin/main --oneline` to see exactly what's incoming. If it looks fine, `git merge origin/main` (or just `git pull`). This avoids surprise conflicts in the middle of your work.

**Push rejected ("fetch first").** If the remote has commits you don't have locally, Git rejects your push to prevent overwriting others' work. The fix is to integrate first:
```bash
git pull --rebase origin main   # replay your commits on top of the remote's
git push origin main
```

**Pitfall.** `git push --force` overwrites the remote branch and can erase teammates' commits. Prefer `git push --force-with-lease`, which only forces if no one else has pushed since your last fetch. Never force-push shared branches like `main` unless the whole team agrees.

**Interview angle.** "Difference between fetch and pull?" — `fetch` only downloads and updates remote-tracking refs; `pull` downloads *and* integrates into your branch (it's fetch + merge/rebase). "Why was my push rejected?" — the remote advanced; pull/rebase, resolve, then push.

---

## 7. Undoing Changes

**Theory.** Git rarely loses data — almost any "mistake" is recoverable. The trick is matching the *right undo command* to *where* the change lives (working dir, staging, or committed) and whether it's been shared. The big four are `restore`, `reset`, `revert`, and `reflog`.

```bash
# Working directory / staging
git restore file.txt            # discard unstaged edits to a file (irreversible for those edits)
git restore --staged file.txt   # unstage but keep the edits

# Committed changes
git reset --soft HEAD~1         # undo last commit, KEEP changes staged
git reset --mixed HEAD~1        # undo last commit, keep changes unstaged (default)
git reset --hard HEAD~1         # undo last commit AND discard the changes (dangerous)

git revert <commit>             # create a NEW commit that undoes <commit> (safe on shared history)

git reflog                      # the safety net: a log of everywhere HEAD has been
```

**How it works — reset vs revert (the most important distinction).**
- **`git reset`** moves the branch pointer *backward*, effectively **rewriting history**. It's perfect for local, unshared commits but dangerous on shared branches because it removes commits others may have. The `--soft/--mixed/--hard` flags control what happens to your *files*: soft keeps them staged, mixed keeps them as unstaged edits, hard throws them away.
- **`git revert`** leaves history intact and instead **adds a new commit** that applies the inverse of a previous commit. This is the *safe* way to undo something already pushed, because it doesn't rewrite anyone's history.

**Example — `reset` flags illustrated.** You committed too early. `git reset --soft HEAD~1` puts you back to just-before-the-commit with your changes still staged, ready to amend and re-commit. If instead you wanted to also unstage them, use `--mixed`. If you wanted to nuke them entirely, `--hard` (but be sure).

**Example — undo a bad deploy.** A commit on `main` broke production and it's already pushed. Don't reset (that rewrites shared history). Run `git revert <bad-sha>` to create a clean "undo" commit, push it, and you're rolled back without disturbing anyone's clone.

**The reflog safety net.** Even after a `reset --hard` or a botched rebase, `git reflog` shows every position HEAD held (e.g., `HEAD@{2}`). You can `git reset --hard HEAD@{2}` to jump back to before the mistake. Reflog is local and expires (default ~90 days), but it has saved countless engineers.

**Pitfall.** `git reset --hard` permanently discards uncommitted work in the working directory — and *that* isn't in reflog. Commit or stash before doing anything destructive.

**Interview angle.** "How do you undo a pushed commit?" — `git revert` (adds an inverse commit, safe). "Undo a local commit but keep the code?" — `git reset --soft HEAD~1`. "Recover after `reset --hard`?" — `git reflog` to find the lost commit, then reset back to it.

---

## 8. Stash, Cherry-pick & Tags

**Theory.** These three are everyday "surgical" tools: **stash** parks unfinished work temporarily, **cherry-pick** copies a single commit from one branch to another, and **tags** mark specific commits (typically releases).

```bash
# Stash — shelve work without committing
git stash                       # save tracked changes, clean the working dir
git stash -u                    # include untracked files too
git stash list                  # see your stashes
git stash pop                   # re-apply the latest stash and remove it
git stash apply                 # re-apply but keep it in the stash list

# Cherry-pick — copy one commit onto the current branch
git cherry-pick <commit-sha>

# Tags — name a commit (releases)
git tag v1.2.0                          # lightweight tag
git tag -a v1.2.0 -m "Release 1.2.0"    # annotated tag (recommended: has author/date/message)
git push origin v1.2.0                  # tags are NOT pushed by default
git push origin --tags                  # push all tags
```

**How it works.**
- **Stash** saves your changes onto a separate stack (stored as special commits) and reverts your working directory to a clean state, so you can switch branches or pull without committing half-done work. Popping replays them back.
- **Cherry-pick** takes the *diff* a commit introduced and re-applies it as a **new commit** (new hash) on your current branch — useful for backporting a fix to a release branch without merging the whole feature.
- **Tags** are permanent pointers (unlike branches, they don't move). **Annotated** tags store metadata and are what you use for releases; lightweight tags are just a name on a commit.

**Example — stash to handle an urgent interruption.** You're mid-feature when a production bug arrives. `git stash`, switch to a hotfix branch, fix and ship it, switch back, `git stash pop` — your in-progress work returns exactly as you left it.

**Example — cherry-pick a hotfix.** A critical fix lands on `main` as commit `a1b2c3`. Your `release/2.3` branch needs it but not the rest of `main`. `git switch release/2.3` then `git cherry-pick a1b2c3` copies just that fix over.

**Pitfall.** Cherry-picking the *same* change that later gets merged can create duplicate commits and conflicts. Prefer cherry-pick for isolated backports; for ongoing integration, merge. Also remember: tags must be pushed explicitly — many people wonder why their release tag isn't on GitHub.

**Interview angle.** "What's `git stash` for?" — temporarily shelving uncommitted changes to get a clean working tree. "Lightweight vs annotated tag?" — annotated tags carry author, date, and message (and are stored as full objects), so they're preferred for releases.

---

## 9. Resolving Merge Conflicts

**Theory.** A **merge conflict** happens when two branches change the *same lines* of the same file (or one edits a file the other deletes) and Git can't decide which version wins. Git is conservative: rather than guess, it pauses the merge and asks *you* to resolve it. Conflicts are normal, not errors — knowing how to resolve them calmly is a core skill.

**How it works — conflict markers.** Git rewrites the conflicted region with markers showing both sides:

```text
<<<<<<< HEAD
int timeout = 30;          // your current branch's version
=======
int timeout = 60;          // the incoming branch's version
>>>>>>> feature/config
```

- Everything between `<<<<<<< HEAD` and `=======` is **your** side.
- Everything between `=======` and `>>>>>>> feature/config` is the **incoming** side.
- Your job: edit the file to the correct final result, **delete all three markers**, then stage and continue.

```bash
git merge feature/config        # CONFLICT reported
git status                      # lists "Unmerged paths"
# ...edit each conflicted file, removing markers...
git add <resolved-file>         # mark as resolved
git commit                      # finish the merge (message pre-filled)
# or, to bail out entirely:
git merge --abort
```

**Example.** Two developers both changed the default timeout. After `git merge`, you open the file, see both `30` and `60`, decide the correct value is `60`, remove the markers leaving `int timeout = 60;`, then `git add` and `git commit`. Done.

**Reducing conflicts.** Pull/rebase frequently so branches don't drift; keep changes small and focused; agree on formatting (a shared formatter prevents whitespace-only conflicts); avoid two people rewriting the same file simultaneously.

**Pitfall.** Accidentally committing a leftover marker (`<<<<<<<`) breaks the build. Before committing a resolution, search the file for conflict markers. Also, blindly choosing "accept theirs/mine" in an editor can silently drop the other side's logic — read both sides.

**Interview angle.** "How do you resolve a merge conflict?" — Git marks the conflicting regions; you edit to the intended result, remove the markers, `git add` the file, and complete the merge (or `git merge --abort` to start over). Mention prevention: small, frequent merges and shared formatting.

---

## 10. .gitignore & Tracking Files

**Theory.** Not everything belongs in version control. Build artifacts, dependencies, secrets, and machine-specific files should be **ignored**. A **`.gitignore`** file lists patterns of paths Git should not track. This keeps the repo small, avoids leaking secrets, and prevents noisy diffs.

```gitignore
# Dependencies
node_modules/
target/
__pycache__/

# Build output
dist/
build/
*.class

# Secrets & local config (never commit these)
.env
*.pem
application-local.properties

# IDE / OS noise
.idea/
.vscode/
.DS_Store

# Logs
*.log
```

**How it works.** `.gitignore` only affects **untracked** files. If a file is *already tracked*, adding it to `.gitignore` does nothing — Git keeps tracking it. To stop tracking a file you previously committed, remove it from the index but keep it on disk:

```bash
git rm --cached .env          # stop tracking, keep the local file
echo ".env" >> .gitignore     # ignore it going forward
git commit -m "Stop tracking .env and ignore it"
```

**Critical — secrets.** If you accidentally commit a secret (API key, password), adding it to `.gitignore` later is **not enough** — it still lives in history and anyone with the repo can read it. You must (1) immediately **rotate/revoke** the secret, and (2) purge it from history (e.g., with `git filter-repo` or BFG) and force-push. Treat any committed secret as compromised.

**Large files.** Git is built for text/source, not large binaries (videos, datasets, big assets). Committing them bloats every clone forever. Use **Git LFS (Large File Storage)**, which stores big files outside the main history and keeps lightweight pointers in the repo.

**Pitfall.** A committed `node_modules/` or `target/` folder makes the repo huge and clones slow. Set up `.gitignore` *before* the first commit; if it's already in, `git rm -r --cached <folder>` and commit.

**Interview angle.** "You committed a password — what now?" — rotate the secret immediately (assume it's leaked), then rewrite history to remove it and force-push. Ignoring it afterward is insufficient because history retains it.

---

## 11. GitHub Essentials

**Theory.** GitHub wraps Git with a web UI and collaboration features. The building blocks: a **repository** (a hosted Git repo plus issues/PRs/settings), a **fork** (your personal server-side copy of someone else's repo), a **clone** (a local copy), **pull requests** (proposals to merge changes with review), and **branch protection** (rules that guard important branches).

**How it works — clone vs fork.**
- **Clone**: copy a repo to your machine. You can push back only if you have write access.
- **Fork**: GitHub makes a copy of the repo *under your account*. You clone *that*, push to it freely, and open a pull request back to the original. This is the standard model for contributing to projects you don't have write access to (open source).

```bash
# Contributing to a repo you don't own (fork-and-PR model):
# 1. Click "Fork" on GitHub
git clone https://github.com/<you>/<repo>.git
cd <repo>
git remote add upstream https://github.com/<original>/<repo>.git   # track the original
git switch -c fix/typo
# ...make changes, commit...
git push origin fix/typo
# 2. Open a Pull Request from your fork → upstream
git fetch upstream && git merge upstream/main   # keep your fork up to date
```

**Authentication.** GitHub no longer accepts account passwords over HTTPS. Use a **Personal Access Token (PAT)** in place of a password, or set up **SSH keys** for password-less push/pull. SSH is convenient for your own machine; PATs are common in scripts and CI.

**Example.** To fix a typo in an open-source library: fork it, clone your fork, branch, commit the fix, push to your fork, and open a PR to the upstream repo. Maintainers review and merge.

**Interview angle.** "Fork vs clone?" — a clone is a local copy; a fork is a server-side copy under your account that enables contributing without write access (you PR back to the source). "Why did `git push` ask for a token, not my password?" — GitHub requires PATs or SSH keys instead of account passwords.

---

## 12. Pull Requests & Code Review

**Theory.** A **Pull Request (PR)** is a request to merge one branch into another, wrapped in a review and discussion workflow. It's where code quality is enforced: teammates read the diff, comment, request changes, and approve before the code reaches `main`. PRs also run **automated checks** (CI: tests, linters, builds) so broken code is caught before merge.

**How it works — the lifecycle.**
1. Branch off `main`, commit your work, push the branch.
2. Open a PR (`base: main` ← `compare: feature/x`) with a clear title and description (what changed and *why*, plus how to test).
3. CI runs automatically; reviewers comment and approve or request changes.
4. You address feedback by pushing more commits to the same branch (the PR updates live).
5. Once approved and green, **merge** — then delete the branch.

**Three ways to merge a PR (know the difference):**

| Strategy | What it does | History result |
|---|---|---|
| **Merge commit** | Keeps all commits + adds a merge commit | Full, non-linear history |
| **Squash and merge** | Combines all PR commits into one | Clean, one commit per PR (very popular) |
| **Rebase and merge** | Replays commits onto base, no merge commit | Linear, preserves individual commits |

**Example — a good PR.** Title: "Add rate limiting to login endpoint". Description: explains the abuse it prevents, the algorithm chosen, and how to test it; links the related issue (`Closes #214`). It's ~200 lines, focused, with tests. Reviewers can understand and approve it quickly — small, well-described PRs get merged fast.

**Pitfall.** Giant PRs (2,000+ lines touching everything) are nearly impossible to review well, so bugs slip through. Keep PRs small and single-purpose. Another pitfall: pushing directly to `main` and bypassing review — that's what **branch protection** (require PR + passing checks + approvals) prevents.

**Interview angle.** "Walk me through your PR workflow" and "squash vs merge commit vs rebase merge?" are common. Emphasize small focused PRs, descriptive context, required reviews + CI, and that squash-merge keeps `main` history clean (one commit per feature).

---

## 13. Branching Strategies

**Theory.** A **branching strategy** is the team's agreed convention for how branches are created, named, and merged. It balances stability (don't break `main`) against velocity (ship often). The two dominant models are **Git Flow** and **trunk-based development**.

**Git Flow.** Multiple long-lived branches with strict roles:
- `main` — production-ready, tagged releases only.
- `develop` — integration branch for the next release.
- `feature/*` — branch off `develop`, merge back to `develop`.
- `release/*` — stabilize a release before it goes to `main`.
- `hotfix/*` — urgent fixes branched off `main`.

Good for scheduled releases and versioned software (e.g., desktop apps), but heavy — lots of branches and merging overhead.

**Trunk-based development.** Everyone integrates into a single trunk (`main`) via **short-lived** feature branches merged within a day or two, behind **feature flags** if needed. Favored by teams doing continuous delivery because it minimizes merge pain and keeps everyone close to the latest code. This is the modern default for most web/services teams.

**GitHub Flow** is the lightweight middle ground (and what most GitHub teams use): branch off `main`, open a PR, get review + CI, merge to `main`, deploy. Simple and effective.

**Naming conventions** (pick one and be consistent): `feature/checkout-coupons`, `fix/null-pointer-login`, `chore/upgrade-deps`, `hotfix/payment-timeout`.

**Example.** A SaaS team uses trunk-based: a dev branches `feature/export-csv`, ships it in a day behind a feature flag, merges to `main`, and CI auto-deploys. A company shipping quarterly desktop releases might prefer Git Flow to stabilize each version on a `release/*` branch.

**Pitfall.** Adopting heavyweight Git Flow on a fast-moving web team creates needless merge overhead and stale branches; conversely, trunk-based without tests/feature flags risks shipping half-done work. Match the strategy to your release cadence.

**Interview angle.** "Which branching strategy and why?" — there's no single right answer; explain the trade-off (Git Flow for versioned/scheduled releases, trunk-based/GitHub Flow for continuous delivery) and tie it to release cadence and team size.

---

## 14. GitHub Actions (CI/CD)

**Theory.** **GitHub Actions** is GitHub's built-in automation/CI-CD system. You define **workflows** in YAML under `.github/workflows/`, and GitHub runs them automatically on **events** (push, pull request, schedule, manual trigger). This is how teams automatically test every PR, build artifacts, and deploy — without a separate CI server. **CI (Continuous Integration)** = automatically build + test every change; **CD (Continuous Delivery/Deployment)** = automatically release it.

**How it works — the hierarchy.**
- **Workflow** — a YAML file triggered by an event.
- **Job** — a set of steps that run on a fresh virtual machine (**runner**); jobs run in parallel by default.
- **Step** — a single command or a reusable **action** (e.g., `actions/checkout`).

```yaml
# .github/workflows/ci.yml
name: CI
on:
  push:
    branches: [ main ]
  pull_request:            # run on every PR — this is the quality gate

jobs:
  build-and-test:
    runs-on: ubuntu-latest          # fresh VM for this job
    steps:
      - uses: actions/checkout@v4   # check out the repo into the runner
      - uses: actions/setup-java@v4
        with:
          java-version: '21'
          cache: maven               # cache dependencies for faster runs
      - run: mvn -B verify           # compile + run tests; non-zero exit fails the PR
```

**How it gates quality.** When a workflow runs on `pull_request`, its result appears as a **check** on the PR. Combined with branch protection ("require status checks to pass"), a PR with failing tests simply *cannot* be merged. That's the automated safety net replacing "it works on my machine".

**Example — a real pipeline.** On every PR: checkout → install deps (cached) → lint → run unit + integration tests → build a Docker image. On merge to `main`: additionally push the image to a registry and deploy to staging. Secrets (registry passwords, deploy tokens) are stored in **GitHub Secrets**, never in the YAML.

**Pitfall.** Hardcoding credentials in workflow files leaks them in history — always use `${{ secrets.NAME }}`. Another: not caching dependencies makes every run slow and expensive. And using `:latest` Docker tags makes deploys non-reproducible — pin versions.

**Interview angle.** "How would you set up CI/CD?" — describe triggering a workflow on PRs to run tests/lint as a required check (so broken code can't merge), then on merge to `main` build and deploy, with secrets in the platform's secret store and dependency caching for speed.

---

## 15. Collaboration & Project Management

**Theory.** Beyond code, GitHub coordinates *how teams work*: **Issues** track bugs and tasks, **labels/milestones/Projects** organize them, **branch protection rules** enforce process, **CODEOWNERS** auto-assigns reviewers, and **Releases** publish versioned builds. Knowing these signals that you can operate inside a real team, not just push code.

**Key features.**
- **Issues** — trackable units of work (bug reports, feature requests). Link them to PRs; writing `Closes #123` in a PR auto-closes the issue on merge.
- **Labels & Milestones** — categorize (`bug`, `priority:high`) and group issues toward a release.
- **Projects (boards)** — Kanban-style tracking of issues/PRs across columns (To do → In progress → Done).
- **Branch protection rules** — require PRs, passing checks, and a minimum number of approvals before merging into `main`; optionally forbid force-pushes.
- **CODEOWNERS** — a file mapping paths to owners so the right people are auto-requested for review (e.g., `/payments/ @payments-team`).
- **Releases & tags** — package a tagged commit with release notes and downloadable artifacts.

**Example — issue-to-release flow.** A bug is filed as Issue #42 with label `bug` and added to the current milestone. A dev opens PR "Fix off-by-one in pagination (Closes #42)". CODEOWNERS auto-requests the backend reviewer; CI passes; it's approved and squash-merged — Issue #42 closes automatically. At release time, a `v2.4.0` tag and release notes are published.

**Pitfall.** No branch protection on `main` means anyone can force-push or merge unreviewed code, risking outages and lost history. For shared repos, protect `main`: require PRs, reviews, and green CI.

**Interview angle.** Teams probe whether you understand process: "How do you prevent bad code reaching main?" — branch protection (required reviews + passing CI), CODEOWNERS for the right reviewers, and small reviewed PRs. "How do issues and PRs connect?" — link them; `Closes #N` auto-closes on merge for traceability.

---

## 16. Best Practices & Common Mistakes

**Commit hygiene.**
- Make **small, focused commits** that each do one thing — easier to review, revert, and bisect.
- Write **meaningful messages**: imperative summary ("Add retry to payment client"), with a body explaining *why* when it's non-obvious.
- Don't commit commented-out code, debug prints, or unrelated formatting churn.

**Branch & merge hygiene.**
- Keep branches **short-lived**; integrate with `main` frequently to avoid giant conflicts.
- Use clear branch names (`feature/`, `fix/`, `chore/`).
- Delete branches after merge to keep the repo tidy.

**Safety.**
- **Never commit secrets** (`.env`, keys, tokens). If you do, rotate immediately and purge history.
- Avoid `git push --force` on shared branches; use `--force-with-lease` when force is truly needed.
- Pull/rebase before pushing to avoid rejected pushes and surprise conflicts.

**Collaboration.**
- Keep PRs **small and described**; link issues; respond to review comments by pushing follow-up commits.
- Require CI + reviews on protected branches so quality isn't optional.

**Common mistakes (and the fix):**

| Mistake | Why it hurts | Fix |
|---|---|---|
| Committing `node_modules/`, build output | Bloats repo, slow clones | `.gitignore` before first commit; `git rm -r --cached` |
| Committing secrets | Leaks credentials forever | Rotate the secret; purge history; ignore going forward |
| Giant, unfocused PRs | Unreviewable; bugs slip in | Split into small, single-purpose PRs |
| `git reset --hard` on shared history | Erases others' commits | Use `git revert` for shared branches |
| Force-pushing shared branches | Breaks teammates' clones | `--force-with-lease`; coordinate; avoid on `main` |
| Vague messages ("fix", "update") | History is useless later | Imperative summary + the "why" |

**Interview angle.** Expect "What are your Git best practices?" — small focused commits with good messages, short-lived branches, never commit secrets, prefer `revert` over `reset` on shared history, small reviewed PRs, and CI as a required gate. Concrete examples beat buzzwords.

---

## 17. Interview Q&A

**Q1. Git vs GitHub?**
Git is a distributed version control *tool* you run locally; GitHub is a *hosting platform* that stores Git repos and adds collaboration (PRs, issues, reviews, CI/CD, access control). Git works fully offline; GitHub is where teams share.

**Q2. Is a commit a diff or a snapshot?**
A snapshot. Each commit points to a complete tree (the full project state) plus parent commit(s); Git computes diffs on demand by comparing two snapshots. Unchanged files reuse the same blob hash for efficiency.

**Q3. Why is branching cheap in Git?**
A branch is just a movable pointer (a tiny file) to a commit — creating one doesn't copy files, it writes one ref. Switching branches just moves HEAD.

**Q4. `git fetch` vs `git pull`?**
`fetch` downloads remote commits and updates remote-tracking refs (e.g., `origin/main`) without touching your files. `pull` is `fetch` + `merge` (or `rebase`) into your current branch — it changes your working tree.

**Q5. Merge vs rebase?**
Merge preserves history and creates a merge commit (non-linear). Rebase rewrites your commits onto the target tip for a linear history (new hashes). Golden rule: never rebase commits others have already pulled.

**Q6. How do you undo a commit that's already pushed?**
`git revert <sha>` — it adds a new commit that inverts the change, keeping shared history intact. Don't `reset` shared branches.

**Q7. Difference between `reset --soft`, `--mixed`, `--hard`?**
All move the branch pointer back. `--soft` keeps changes staged, `--mixed` (default) keeps them unstaged, `--hard` discards them entirely (dangerous).

**Q8. How do you resolve a merge conflict?**
Git marks conflicting regions with `<<<<<<<`, `=======`, `>>>>>>>`. Edit the file to the intended result, remove all markers, `git add` it, and commit (or `git merge --abort` to back out).

**Q9. You committed a secret. What do you do?**
Assume it's compromised: rotate/revoke it immediately, then rewrite history to remove it (`git filter-repo`/BFG) and force-push. Adding it to `.gitignore` alone doesn't remove it from history.

**Q10. What recovers a commit after `git reset --hard`?**
`git reflog` lists every position HEAD held; find the lost commit and `git reset --hard HEAD@{n}`. (Only committed work is recoverable this way — not uncommitted edits.)

**Q11. `git merge --squash` / squash merge — why use it?**
It collapses all of a branch's commits into a single commit on the target, keeping `main` history clean (one commit per feature/PR) and hiding noisy WIP commits.

**Q12. What is HEAD? What's a "detached HEAD"?**
HEAD points to your current location (usually the current branch). Detached HEAD means HEAD points directly at a commit, not a branch — commits made there aren't on any branch and can be lost unless you create a branch.

**Q13. `git cherry-pick` use case?**
Copy a specific commit (e.g., a hotfix) from one branch onto another without merging the whole branch — common for backporting a fix to a release branch.

**Q14. How do you keep a fork in sync with the original?**
Add the original as `upstream`, then `git fetch upstream` and `git merge upstream/main` (or rebase) into your branch.

**Q15. How do you enforce code quality on `main`?**
Branch protection: require pull requests, a minimum number of approvals, and passing CI status checks; use CODEOWNERS to auto-request the right reviewers; forbid force-pushes to `main`.

**Q16. What's `--force-with-lease` and why prefer it over `--force`?**
`--force-with-lease` only overwrites the remote branch if no one else has pushed since your last fetch, preventing you from clobbering teammates' commits. Plain `--force` overwrites unconditionally.
