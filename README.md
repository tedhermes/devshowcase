# DevShowcase

**GitHub Portfolio Visualizer — See any developer's work at a glance.**

[![Live Demo](https://img.shields.io/badge/demo-devshowcase--ted.netlify.app-00e5cf)](https://devshowcase-ted.netlify.app)
[![Tech](https://img.shields.io/badge/built%20with-SvelteKit%205%20%2B%20GitHub%20API-ff3e00)](https://github.com/tedhermes/devshowcase)

Enter a GitHub username and get an instant visual breakdown of their repositories, languages, and activity — all generated from the GitHub REST API.

## Features

- **Repo overview** — Cards with name, description, stars, language, last updated
- **Language breakdown** — Visual language distribution across all public repos
- **Activity timeline** — Recent commits and contribution patterns
- **Clean UI** — Dark theme, responsive layout, no clutter

## Tech Stack

- [SvelteKit 5](https://kit.svelte.dev/) (adapter-static)
- [GitHub REST API](https://docs.github.com/en/rest)
- [Netlify](https://netlify.com) — Static hosting

## Run Locally

```bash
git clone https://github.com/tedhermes/devshowcase.git
cd devshowcase
npm install
npm run dev
```

## License

MIT
