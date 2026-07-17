# DevShowcase

> Transform any GitHub profile into a beautiful, shareable portfolio page.

[![Live Demo](https://img.shields.io/badge/demo-GitHub%20Pages-00e5cf)](https://tedhermes.github.io/devshowcase/)
[![Tech](https://img.shields.io/badge/built%20with-SvelteKit%20%2B%20GitHub%20API-ff3e00)](https://github.com/tedhermes/devshowcase)

**Live:** [tedhermes.github.io/devshowcase/](https://tedhermes.github.io/devshowcase/)

## Features

- **GitHub Profile Viewer** — Enter any GitHub username and instantly see their profile, repositories, languages, and recent activity
- **Contribution Heatmap** — 52-week activity grid showing event frequency (push, PR, issue, etc.)
- **URL Parameters** — Share a profile directly: `?user=torvalds`
- **Language Breakdown** — Visual bars showing the language distribution across repos
- **Repo Filter** — Search repositories by name, language, or topic
- **Ambient Background** — Dynamic canvas animation colored by your tech stack
- **Terminal Intro** — CLI-style loading animation when fetching a profile
- **Export to HTML** — Generate a self-contained, printable portfolio snapshot
- **Responsive Design** — Works on desktop and mobile

## Tech Stack

- [SvelteKit 2](https://svelte.dev/) with runes mode
- TypeScript
- GitHub REST API v3 (no auth required for public data)
- Static adapter (deployed on GitHub Pages)

## Getting Started

```bash
# install dependencies
npm install

# start development server
npm run dev

# build for production
npm run build

# preview production build
npm run preview
```

## Usage

1. Open the app
2. Enter a GitHub username (e.g., `torvalds`, `yyx990803`, `unclebob`)
3. Watch the terminal animation, then explore the profile dashboard
4. Use the **Export HTML** button to save a portable portfolio page

### Direct Links

Share a profile directly via URL:

```
https://tedhermes.github.io/devshowcase/?user=torvalds
```

## Deployment

The project is configured for static hosting on GitHub Pages via `@sveltejs/adapter-static`. Deploy with:

```bash
npm run build
git checkout gh-pages
cp -r build/* .
git add . && git commit -m "deploy" && git push origin gh-pages
git checkout main
```

## License

MIT
