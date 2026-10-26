# rudnaya-palata

React + TypeScript + Vite + Tailwind CSS application prepared for standalone PWA deployment.

The application uses a fixed 800 × 1200 portrait canvas. Layout does not switch or resize based on viewport dimensions.

## Project Structure

This is the canonical project structure. Start with task-relevant files below. Only follow imports or inspect other files when required, when a documented path is missing, or when the repository contradicts this guide.

- `src/main.tsx` - React entrypoint; imports the application and global styles, then mounts into `#root`
- `src/app/App.tsx` - Primary application component
- `src/data/content.ts` - Application text, game content, and configuration data
- `src/styles/base.css` - Tailwind CSS v4 entrypoint, theme, and base styles
- `src/styles/game.css` - Application-specific visual styles
- `index.html` - Vite HTML shell containing the `#root` element and loading `src/main.tsx`
- `package.json` - Project dependencies and the Vite build, development, preview, and formatting scripts
- `vite.config.ts` - Standard Vite configuration with React and Tailwind CSS v4
- `public/manifest.webmanifest` - PWA installation metadata
- `public/sw.js` - Service worker for offline app-shell and asset caching
- `public/icons/` - Application and browser icons

## Dependencies

- Runtime: React 19 and React DOM 19
- Styling: Tailwind CSS v4 with the `@tailwindcss/vite` plugin
- Build tooling: Vite 8, TypeScript 5.7, and `@vitejs/plugin-react`
- Formatting: oxfmt

## Styling

`src/styles/base.css` contains the Tailwind import, font faces, theme tokens, fixed-canvas reset, and reduced-motion preference. `src/styles/game.css` contains the application components and screen layouts; each selector should have a single rule there, so update an existing component rule rather than adding an override elsewhere.

`src/main.tsx` imports `base.css` before `game.css`. Keep global font wiring and design tokens in `base.css`; keep all component and screen styling in `game.css`. This project uses **Tailwind CSS v4** through the `@tailwindcss/vite` plugin and does not need a Tailwind config file or PostCSS config.

Tailwind emits utility classes in `@layer utilities`, and CSS outside any cascade layer overrides every layer regardless of specificity. Put global element styles, such as resets and defaults for `body`, headings, `button`, or `input`, inside `@layer base { ... }` so utility classes on those elements still apply. Tailwind's Preflight already applies `box-sizing: border-box`, removes default margins, and sets `font: inherit` on form controls, so do not repeat those rules.
