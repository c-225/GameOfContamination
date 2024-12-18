import {defineConfig} from 'vite'
import tailwindcss from "tailwindcss";

// https://vite.dev/config/
export default defineConfig({
	base: process.env.GITHUB_ACTIONS ? "/game-of-life/" : "/",
	css: {
		postcss: {
			plugins: [tailwindcss()]
		}
	}
})