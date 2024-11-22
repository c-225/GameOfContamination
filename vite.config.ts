import {defineConfig} from 'vite'

// https://vite.dev/config/
export default defineConfig({
	base: process.env.GITHUB_ACTIONS ? "/game-of-life/" : "/",
})