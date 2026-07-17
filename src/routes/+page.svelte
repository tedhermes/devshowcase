<script lang="ts">
	// ========================================
	// CONFIG
	// ========================================
	const LANG_COLORS: Record<string, string> = {
		'JavaScript': '#f1e05a', 'TypeScript': '#3178c6', 'Python': '#3572A5',
		'Go': '#00ADD8', 'Rust': '#dea584', 'C': '#555555', 'C++': '#f34b7d',
		'Java': '#b07219', 'Ruby': '#701516', 'PHP': '#4F5D95', 'Swift': '#F05138',
		'Kotlin': '#A97BFF', 'Scala': '#c22d40', 'Haskell': '#5e5086', 'Lua': '#000080',
		'Shell': '#89e051', 'HTML': '#e34c26', 'CSS': '#563d7c', 'Vue': '#41b883',
		'Svelte': '#ff3e00', 'Dart': '#00B4AB', 'Elixir': '#6e4a7e', 'Clojure': '#db5855',
		'Assembly': '#6E4C13', 'TeX': '#3D6117', 'Dockerfile': '#384d54',
		'Makefile': '#427819', 'Jupyter Notebook': '#DA5B0B', 'Solidity': '#AA6746',
		'Zig': '#ec915c', 'Nix': '#7e7eff', 'Racket': '#3c5caa',
	};
	const DEFAULT_COLOR = '#8b8b8b';

	interface GitHubUser {
		login: string; name: string; avatar_url: string; html_url: string;
		bio: string; company: string; location: string; blog: string;
		twitter_username: string; public_repos: number; followers: number;
		following: number;
	}

	interface GitHubRepo {
		name: string; description: string; html_url: string; language: string;
		stargazers_count: number; forks_count: number; updated_at: string;
		topics: string[]; fork: boolean; archived: boolean;
	}

	interface GitHubEvent {
		type: string; created_at: string; repo: { name: string };
		payload: Record<string, any>;
	}

	interface ProfileData {
		user: GitHubUser;
		repos: GitHubRepo[];
		events: GitHubEvent[];
	}

	// ========================================
	// STATE
	// ========================================
	let username = $state('');
	let currentUser = $state('');
	let profileData = $state<ProfileData | null>(null);
	let isLoading = $state(false);
	let showTerminal = $state(false);
	let errorMsg = $state('');
	let toastMsg = $state('');
	let toastVisible = $state(false);
	let terminalLines = $state<{ text: string; cls: string }[]>([]);
	let imagesLoaded = $state(0);

	// ========================================
	// HELPERS
	// ========================================
	function langColor(lang: string): string {
		return LANG_COLORS[lang] || DEFAULT_COLOR;
	}

	function timeAgo(dateStr: string): string {
		const d = new Date(dateStr);
		const now = new Date();
		const sec = Math.floor((now.getTime() - d.getTime()) / 1000);
		if (sec < 60) return 'just now';
		const min = Math.floor(sec / 60);
		if (min < 60) return `${min}m ago`;
		const h = Math.floor(min / 60);
		if (h < 24) return `${h}h ago`;
		const days = Math.floor(h / 24);
		if (days < 30) return `${days}d ago`;
		return d.toLocaleDateString('en-US');
	}

	function fmt(n: number): string {
		if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
		if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
		return String(n);
	}

	function showToast(msg: string) {
		toastMsg = msg;
		toastVisible = true;
		setTimeout(() => { toastVisible = false; }, 2500);
	}

	// ========================================
	// AMBIENT CANVAS
	// ========================================
	let canvasEl = $state<HTMLCanvasElement | null>(null);
	let animId = $state<number | null>(null);

	interface Blob {
		x: number; y: number; vx: number; vy: number;
		radius: number; color: string; phase: number;
	}

	let blobs: Blob[] = [];
	let ambientActive = false;
	let mouseX = 0.5, mouseY = 0.5;
	let animFrame: number | null = null;

	function initAmbient(canvas: HTMLCanvasElement) {
		canvasEl = canvas;
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		window.addEventListener('resize', () => {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
		});
		document.addEventListener('mousemove', (e) => {
			mouseX = e.clientX / window.innerWidth;
			mouseY = e.clientY / window.innerHeight;
		});
	}

	function setAmbientColors(langMap: Record<string, number>) {
		const cols: { color: string; weight: number }[] = [];
		let total = 0;
		for (const [lang, count] of Object.entries(langMap)) {
			cols.push({ color: langColor(lang), weight: count });
			total += count;
		}
		if (cols.length === 0) cols.push({ color: '#8b8b8b', weight: 1 });
		for (const c of cols) c.weight = c.weight / total;

		// Spawn blobs
		blobs = [];
		const target = Math.max(8, Math.min(cols.length * 3, 16));
		for (let i = 0; i < target; i++) {
			const c = cols[i % cols.length];
			blobs.push({
				x: Math.random(), y: Math.random(),
				vx: (Math.random() - 0.5) * 0.004,
				vy: (Math.random() - 0.5) * 0.004,
				radius: 0.35 + Math.random() * 0.35,
				color: c.color,
				phase: Math.random() * Math.PI * 2,
			});
		}

		ambientActive = true;
		if (canvasEl) canvasEl.classList.add('active');
		if (!animFrame) ambientLoop();
	}

	function fadeOutAmbient() {
		ambientActive = false;
		if (canvasEl) canvasEl.classList.remove('active');
		if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null; }
		const ctx = canvasEl?.getContext('2d');
		if (ctx && canvasEl) ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
	}

	function ambientLoop() {
		if (!ambientActive || !canvasEl) { animFrame = null; return; }
		animFrame = requestAnimationFrame(ambientLoop);
		const ctx = canvasEl.getContext('2d');
		if (!ctx) return;
		const w = canvasEl.width, h = canvasEl.height;
		ctx.clearRect(0, 0, w, h);

		for (const b of blobs) {
			b.x += b.vx + (mouseX - 0.5) * 0.0003;
			b.y += b.vy + (mouseY - 0.5) * 0.0003;
			if (b.x < -0.2) b.x = 1.2;
			if (b.x > 1.2) b.x = -0.2;
			if (b.y < -0.2) b.y = 1.2;
			if (b.y > 1.2) b.y = -0.2;

			const cx = b.x * w;
			const cy = b.y * h;
			const r = b.radius * Math.max(w, h) * 0.4;

			const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
			const pulse = Math.sin(Date.now() * 0.0005 + b.phase);
			const alpha = Math.max(0.1, Math.min(0.3, 0.2 + pulse * 0.06));
			grad.addColorStop(0, hexToRgba(b.color, alpha));
			grad.addColorStop(0.5, hexToRgba(b.color, alpha * 0.5));
			grad.addColorStop(1, hexToRgba(b.color, 0));

			ctx.fillStyle = grad;
			ctx.fillRect(0, 0, w, h);
		}
	}

	function hexToRgba(hex: string, a: number): string {
		let r = 140, g = 140, b = 140;
		if (hex.length === 7) {
			r = parseInt(hex.slice(1, 3), 16);
			g = parseInt(hex.slice(3, 5), 16);
			b = parseInt(hex.slice(5, 7), 16);
		}
		return `rgba(${r},${g},${b},${a})`;
	}

	// ========================================
	// GITHUB API
	// ========================================
	async function fetchGH(url: string): Promise<any> {
		const res = await fetch(url, {
			headers: { 'Accept': 'application/vnd.github.v3+json' }
		});
		if (!res.ok) {
			if (res.status === 403) throw new Error('API rate limit reached. Please wait.');
			if (res.status === 404) throw new Error('User not found.');
			throw new Error(`Error ${res.status}`);
		}
		return res.json();
	}

	async function actuallyLoadProfile(u: string) {
		isLoading = true;
		try {
			const [user, repos, events] = await Promise.all([
				fetchGH(`https://api.github.com/users/${u}`),
				fetchGH(`https://api.github.com/users/${u}/repos?per_page=100&sort=updated`),
				fetchGH(`https://api.github.com/users/${u}/events?per_page=10`),
			]) as [GitHubUser, GitHubRepo[], GitHubEvent[]];

			profileData = { user, repos, events };
			isLoading = false;

			// Start ambient background
			const langCounts: Record<string, number> = {};
			repos.filter(r => r.language && !r.archived && !r.fork).forEach(r => {
				langCounts[r.language] = (langCounts[r.language] || 0) + 1;
			});
			setAmbientColors(langCounts);
		} catch (e: any) {
			isLoading = false;
			showTerminal = false;
			errorMsg = e.message || 'Error loading profile';
		}
	}

	function startTerminal(u: string) {
		currentUser = u;
		fadeOutAmbient();
		errorMsg = '';
		profileData = null;

		const lines = [
			{ text: `fetching github.com/${u} ...`, cls: 'cmd', delay: 200 },
			{ text: '> connection established', cls: 'ok', delay: 400 },
			{ text: '> receiving profile: repos, languages, events', cls: 'dim', delay: 500 },
			{ text: '', cls: '', delay: 300 },
			{ text: 'done. rendering dashboard.', cls: 'highlight', delay: 600 },
		];

		showTerminal = true;

		// Animate terminal lines
		let totalDelay = 0;
		const displayLines: { text: string; cls: string; delay: number }[] = [];
		for (const line of lines) {
			totalDelay += line.delay;
			displayLines.push({ ...line, delay: totalDelay });
		}

		// Play lines with stagger
		terminalLines = [];
		for (const line of lines) {
			setTimeout(() => {
				terminalLines = [...terminalLines, line];
			}, displayLines.find(l => l.text === line.text && l.cls === line.cls)?.delay || 0);
		}

		const endTime = totalDelay + 200;
		setTimeout(() => {
			// After terminal, load profile
			setTimeout(() => {
				showTerminal = false;
				terminalLines = [];
				setTimeout(() => actuallyLoadProfile(u), 400);
			}, 800);
		}, endTime);
	}

	function loadProfile(u: string) {
		const trimmed = u.trim().toLowerCase();
		if (!trimmed) return;
		startTerminal(trimmed);
	}

	function loadExample(u: string) {
		username = u;
		loadProfile(u);
	}

	function resetApp() {
		profileData = null;
		errorMsg = '';
		username = '';
		fadeOutAmbient();
	}

	// ========================================
	// DERIVED
	// ========================================
	let sortedRepos = $derived.by(() => {
		if (!profileData) return [];
		return profileData.repos
			.filter(r => !r.fork || r.stargazers_count > 0)
			.sort((a, b) => b.stargazers_count - a.stargazers_count)
			.slice(0, 30);
	});

	let totalStars = $derived.by(() => {
		let s = 0;
		for (const r of sortedRepos) s += r.stargazers_count;
		return s;
	});

	let languageData = $derived.by(() => {
		const counts: Record<string, number> = {};
		let total = 0;
		sortedRepos.filter(r => r.language && !r.archived && !r.fork).forEach(r => {
			counts[r.language] = (counts[r.language] || 0) + 1;
			total++;
		});
		const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
		const max = sorted.length ? sorted[0][1] : 1;
		return { items: sorted, total, max };
	});

	// ========================================
	// CHECK URL PARAMS
	// ========================================
	$effect(() => {
		if (typeof window !== 'undefined') {
			const params = new URLSearchParams(window.location.search);
			const userParam = params.get('user');
			if (userParam) {
				username = userParam;
				setTimeout(() => loadProfile(userParam), 300);
			}
		}
	});

	// Init canvas
	$effect(() => {
		if (canvasEl) {
			initAmbient(canvasEl);
		}
	});

	// ========================================
	// ACTIVITY RENDER HELPERS
	// ========================================
	const activityIcons: Record<string, string> = {
		'PushEvent': '\u270E', 'CreateEvent': '+', 'IssuesEvent': '!',
		'IssueCommentEvent': '\u270D', 'PullRequestEvent': '\u2B1A', 'WatchEvent': '\u2605',
		'ForkEvent': '\u2B76', 'DeleteEvent': '\u00D7', 'ReleaseEvent': '\u25B2',
		'PublicEvent': '\u25C8', 'GollumEvent': '\u270D',
	};

	function activityText(e: GitHubEvent): string {
		switch (e.type) {
			case 'PushEvent': {
				const branch = (e.payload.ref || '').replace('refs/heads/', '');
				const commits = e.payload.commits || [];
				return `<strong>${esc(e.repo.name)}</strong> &middot; ${commits.length} Commit${commits.length !== 1 ? 's' : ''} to <strong>${esc(branch)}</strong>`;
			}
			case 'CreateEvent':
				return `<strong>${esc(e.repo.name)}</strong> &middot; ${e.payload.ref_type || ''} <strong>${esc(e.payload.ref || '')}</strong> created`;
			case 'IssuesEvent':
				return `<strong>${esc(e.repo.name)}</strong> &middot; Issue ${e.payload.action || ''}: <strong>${esc(e.payload.issue?.title || '')}</strong>`;
			case 'IssueCommentEvent':
				return `<strong>${esc(e.repo.name)}</strong> &middot; Comment on issue #${e.payload.issue?.number || ''}`;
			case 'PullRequestEvent':
				return `<strong>${esc(e.repo.name)}</strong> &middot; PR ${e.payload.action || ''}: <strong>${esc(e.payload.pull_request?.title || '')}</strong>`;
			case 'WatchEvent':
				return `<strong>${esc(e.repo.name)}</strong>`;
			case 'ForkEvent':
				return `<strong>${esc(e.repo.name)}</strong> &middot; ${esc(e.payload.forkee?.full_name || '')}`;
			case 'ReleaseEvent':
				return `<strong>${esc(e.repo.name)}</strong> &middot; ${esc(e.payload.release?.tag_name || '')}`;
			default:
				return `<strong>${esc(e.repo.name)}</strong> &middot; ${e.type.replace('Event', '')}`;
		}
	}

	function esc(s: string | undefined | null): string {
		if (!s) return '';
		const d = document.createElement('div');
		d.textContent = s;
		return d.innerHTML;
	}

	// ========================================
	// EXPORT
	// ========================================
	function exportHTML() {
		if (!profileData) { showToast('No data to export.'); return; }
		const u = profileData.user;
		const repos = sortedRepos.slice(0, 20);

		const langEntries = languageData.items.slice(0, 8);
		const langMax = langEntries.length ? langEntries[0][1] : 1;
		const langHtml = langEntries.length
			? langEntries.map(([l, c]) =>
				`<div style="margin-bottom:10px;"><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;"><span>${esc(l)}</span><span style="color:#888;">${c} Repos</span></div><div style="height:6px;background:#eee;border-radius:3px;overflow:hidden;"><div style="height:100%;width:${(c / langMax) * 100}%;background:${langColor(l)};border-radius:3px;"></div></div></div>`
			).join('')
			: '<p style="color:#888;">No languages detected.</p>';

		const repoHtml = repos.length
			? repos.map(r =>
				`<div style="padding:14px;border:1px solid #e5e5e5;border-radius:6px;"><div style="font-weight:600;margin-bottom:4px;">${esc(r.name)}</div>${r.description ? `<div style="font-size:13px;color:#666;margin-bottom:8px;">${esc(r.description)}</div>` : ''}<div style="font-size:12px;color:#999;">\u2605 ${fmt(r.stargazers_count)} &middot; ${r.language || ''}</div></div>`
			).join('\n')
			: '<p style="color:#888;">No public repositories.</p>';

		const exportHtml = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${esc(u.name || u.login)} — Portfolio</title>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}body{font-family:"Geist",system-ui,-apple-system,sans-serif;background:#fafafa;color:#171717;line-height:1.5;-webkit-font-smoothing:antialiased;}.w{max-width:720px;margin:0 auto;padding:48px 24px;}h1{font-size:28px;font-weight:600;letter-spacing:-0.02em;margin-bottom:4px;}.sub{color:#666;font-size:15px;margin-bottom:24px;}.stat{display:flex;gap:24px;margin-bottom:24px;font-family:"Geist Mono",monospace;font-size:13px;}.stat div span:first-child{font-weight:600;}.stat div span:last-child{color:#999;}h2{font-size:13px;font-weight:500;font-family:"Geist Mono",monospace;color:#a1a1aa;text-transform:uppercase;letter-spacing:0.02em;margin-bottom:12px;margin-top:32px;}.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}@media(max-width:500px){.grid{grid-template-columns:1fr;}}.card{padding:14px;background:#fff;border-radius:6px;box-shadow:0px 0px 0px 1px rgba(0,0,0,0.08);text-decoration:none;color:inherit;}.card .n{font-family:"Geist Mono",monospace;font-size:13px;font-weight:600;margin-bottom:4px;}.card .d{font-size:13px;color:#666;margin-bottom:8px;}.card .m{font-size:12px;color:#999;}footer{text-align:center;padding:32px 0;font-size:11px;color:#a1a1aa;font-family:"Geist Mono",monospace;}a{color:#0072f5;text-decoration:none;}@media print{body{background:#fff;}.card{box-shadow:none;border:1px solid #eee;}}</style>
</head><body>
<div class="w">
<h1>${esc(u.name || u.login)}</h1>
<div class="sub">${u.bio ? esc(u.bio) : ''}</div>
<div class="stat"><div><span>${fmt(u.public_repos)}</span> <span>Repos</span></div><div><span>${fmt(u.followers)}</span> <span>Followers</span></div><div><span>${fmt(totalStars)}</span> <span>Stars</span></div></div>
<div style="margin-bottom:32px;"><a href="${esc(u.html_url)}" target="_blank">GitHub</a>${u.blog ? ` &middot; <a href="${u.blog.indexOf('http') === 0 ? esc(u.blog) : 'https://' + esc(u.blog)}" target="_blank">Website</a>` : ''}${u.twitter_username ? ` &middot; <a href="https://x.com/${esc(u.twitter_username)}" target="_blank">X</a>` : ''}</div>
<h2>Languages</h2>${langHtml}
<h2>Repositories</h2><div class="grid">${repoHtml}</div>
<footer>Generated by DevShowcase &middot; github.com/${esc(u.login)}</footer>
</div>
</body></html>`;

		downloadFile(exportHtml, `${u.login}-portfolio.html`, 'text/html');
		showToast('HTML exported');
	}

	function downloadFile(content: string | Blob, filename: string, mimeType: string) {
		const blob = typeof content === 'string' ? new Blob([content], { type: mimeType }) : content;
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}
</script>

<!-- Ambient Canvas -->
<canvas id="ambientCanvas" bind:this={canvasEl}></canvas>

<!-- Terminal Intro -->
{#if showTerminal}
	<div class="terminal-overlay active">
		<div class="terminal-box">
			{#each terminalLines as line}
				<div class="terminal-line visible">
					{#if line.text}
						<span class="prompt">$ </span><span class={line.cls}>{line.text}</span>
					{/if}
				</div>
			{/each}
			<span class="cursor-blink"></span>
		</div>
	</div>
{/if}

<div class="wrap">
	<header>
		<div class="logo">DevShowcase<span class="logo-sub">.dev</span></div>
	</header>

	<!-- Search Section -->
	<div class="search-section" style="display: {profileData || isLoading || showTerminal ? 'none' : 'block'}">
		<h1>GitHub Profile as Portfolio</h1>
		<p class="sub">Enter a GitHub username to see repos, languages, and activity at a glance.</p>
		<div class="search-row">
			<input
				type="text"
				bind:value={username}
				placeholder="e.g. torvalds"
				onkeydown={(e) => { if (e.key === 'Enter') loadProfile(username); }}
			/>
			<button onclick={() => loadProfile(username)} disabled={!username.trim()}>Analyze</button>
		</div>
		<div class="examples">
			<button onclick={() => loadExample('torvalds')}>torvalds</button>
			<button onclick={() => loadExample('yyx990803')}>yyx990803</button>
			<button onclick={() => loadExample('unclebob')}>unclebob</button>
			<button onclick={() => loadExample('dom')}>dom</button>
		</div>
	</div>

	<!-- Loading State -->
	<div class="state" class:active={isLoading}>
		<div class="loading-wrap">
			<p style="color:var(--dim);font-family:var(--font-mono);font-size:14px;">Loading profile...</p>
		</div>
	</div>

	<!-- Error State -->
	<div class="state" class:active={!!errorMsg && !showTerminal && !isLoading}>
		<div class="error-wrap">
			<h3>Error</h3>
			<p>{errorMsg}</p>
		</div>
	</div>

	<!-- Profile -->
	{#if profileData}
		<div class="profile active">
			<div class="export-bar">
				<button class="export-btn" onclick={exportHTML}><span class="key">&darr;</span> HTML</button>
				<button class="export-btn" onclick={() => showToast('PNG export coming soon.')}><span class="key">&darr;</span> PNG</button>
			</div>

			<!-- Profile Header -->
			<div class="profile-head">
				<div class="avatar">
					<img src={profileData.user.avatar_url} alt={profileData.user.login} />
				</div>
				<div class="info">
					<h2>{profileData.user.name || profileData.user.login}</h2>
					<div class="login">
						<a href={profileData.user.html_url} target="_blank">@{profileData.user.login}</a>
						{#if profileData.user.company} &middot; {profileData.user.company}{/if}
						{#if profileData.user.location} &middot; {profileData.user.location}{/if}
					</div>
					{#if profileData.user.bio}
						<div class="bio">{profileData.user.bio}</div>
					{/if}
					<div class="meta">
						<span class="meta-item"><span class="num">{fmt(profileData.user.public_repos)}</span> <span class="label">Repos</span></span>
						<span class="meta-item"><span class="num">{fmt(profileData.user.followers)}</span> <span class="label">Followers</span></span>
						<span class="meta-item"><span class="num">{fmt(profileData.user.following)}</span> <span class="label">Following</span></span>
						<span class="meta-item"><span class="num">{fmt(totalStars)}</span> <span class="label">Stars</span></span>
					</div>
					<div class="links">
						<a href={profileData.user.html_url} target="_blank">GitHub</a>
						{#if profileData.user.blog}
							<a href={profileData.user.blog.startsWith('http') ? profileData.user.blog : `https://${profileData.user.blog}`} target="_blank">Website</a>
						{/if}
						{#if profileData.user.twitter_username}
							<a href={`https://x.com/${profileData.user.twitter_username}`} target="_blank">X</a>
						{/if}
					</div>
				</div>
			</div>

			<!-- Languages -->
			<div class="section">
				<div class="section-title">Languages</div>
				{#if languageData.items.length > 0}
					<div class="lang-grid">
						{#each languageData.items as [lang, count]}
							{@const pct = ((count / languageData.total) * 100).toFixed(0)}
							<div class="lang-item">
								<div class="name">
									<span style="width:8px;height:8px;border-radius:50%;background:{langColor(lang)};display:inline-block;"></span>
									{lang}
								</div>
								<div class="bar">
									<div class="bar-fill" style="width:{(count / languageData.max) * 100}%;background:{langColor(lang)}"></div>
								</div>
								<div class="pct">{count} Repos ({pct}%)</div>
							</div>
						{/each}
					</div>
				{:else}
					<p style="color:var(--dim);font-size:13px;">No languages detected.</p>
				{/if}
			</div>

			<!-- Repositories -->
			<div class="section">
				<div class="section-title">Repositories</div>
				{#if sortedRepos.length > 0}
					<div class="repo-list">
						{#each sortedRepos as r}
							<a href={r.html_url} target="_blank" class="repo-card">
								<div class="name">{r.name}</div>
								{#if r.description}
									<div class="desc">{r.description}</div>
								{/if}
								<div class="meta">
									{#if r.language}
										<span class="meta-item">
											<span class="dot" style="background:{langColor(r.language)}"></span>
											{r.language}
										</span>
									{/if}
									<span class="meta-item">&starf; {fmt(r.stargazers_count)}</span>
									<span class="meta-item">{'&#8576;'}&#xFE0E; {fmt(r.forks_count)}</span>
									<span class="meta-item">{timeAgo(r.updated_at)}</span>
								</div>
								{#if r.topics && r.topics.length > 0}
									<div class="topics">
										{#each r.topics.slice(0, 4) as topic}
											<span>{topic}</span>
										{/each}
									</div>
								{/if}
							</a>
						{/each}
					</div>
				{:else}
					<p style="color:var(--dim);font-size:13px;">No public repositories.</p>
				{/if}
			</div>

			<!-- Activity -->
			<div class="section">
				<div class="section-title">Activity</div>
				{#if profileData.events.length > 0}
					{#each profileData.events.slice(0, 10) as e}
						<div class="activity-item">
							<div class="activity-icon">{@html activityIcons[e.type] || '&#9679;'}</div>
							<div class="activity-text">{@html activityText(e)}</div>
							<div class="activity-time">{timeAgo(e.created_at)}</div>
						</div>
					{/each}
				{:else}
					<p style="color:var(--dim);font-size:13px;">No public activity.</p>
				{/if}
			</div>
		</div>
	{/if}

	<footer>
		<a href="https://tedhermes.pythonanywhere.com">DevShowcase</a> &middot; GitHub API &middot; Client-side
	</footer>
</div>

<!-- Toast -->
<div class="toast" class:show={toastVisible}>{toastMsg}</div>
