# Deployment

The site deploys to **GitHub Pages** from the `main` branch via a
GitHub Actions workflow (`.github/workflows/deploy.yml`).

## How it works

```
push to main ──► GitHub Actions ──► npm ci
                                 ──► npm run build      (produces dist/)
                                 ──► upload dist/ artifact
                                 ──► actions/deploy-pages → live
```

Build time: ~30 s. The workflow runs only on `main` and on manual
`workflow_dispatch`.

## One-time setup (already done for this repo)

1. **Repository → Settings → Pages**
   - Source: **GitHub Actions**
   - (No need to set a branch — Actions publishes directly.)
2. **Repository → Settings → Actions → General → Workflow permissions**
   - Read & write permissions ✓
   - Allow GitHub Actions to create and approve PRs ✓ (optional)

## Local preview

```bash
npm run build       # → dist/
npm run preview     # serves dist/ at http://localhost:4173/
```

`base: './'` in `vite.config.js` keeps every asset URL relative, so the
build works at the sub-path `derdienstag.github.io/Kostenrechner/` and
also when opened locally as `file://` for a quick smoke test.

## Verifying a deploy

After pushing:

1. Open the Actions tab → wait for the latest run (green check).
2. Open https://derdienstag.github.io/Kostenrechner/
3. Hard-reload (Cmd-Shift-R) to bypass any cached service-worker.

The footer shows the build's `stand` date (config `meta.stand`); use it
to sanity-check that you're looking at the right bundle.

## Rolling back

GitHub Pages doesn't keep old deploys natively. To revert:

```bash
git revert <bad-sha>
git push                       # triggers a fresh deploy of the parent
```

…or check out the previous good commit and push to `main` directly
(only if you're authoritative on the branch — usually use a revert PR).

## Custom domain (future)

Add `public/CNAME` with the hostname, configure the DNS A/AAAA records
to GitHub's IPs, then re-deploy. Vite copies `public/CNAME` verbatim.
