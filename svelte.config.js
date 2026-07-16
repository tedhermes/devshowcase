import adapter from '@sveltejs/adapter-netlify';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		runes: true
	},
	kit: {
		adapter: adapter({
			edge: false,
			split: false
		})
	}
};

export default config;
