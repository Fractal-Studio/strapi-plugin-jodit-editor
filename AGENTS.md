# Repository Guidelines

## Project Structure & Module Organization

This repository is a Strapi v5 plugin named `strapi-plugin-jodit-editor`. Admin UI code lives in `admin/src`, with React components in `admin/src/components`, pages in `admin/src/pages`, translations in `admin/src/translations`, and plugin registration in `admin/src/index.ts`. Server-side code lives in `server/src`, grouped by Strapi concepts: `controllers`, `routes`, `services`, `policies`, `middlewares`, `config`, and lifecycle files. Build output is generated into `dist` and should only change intentionally for releases.

## Build, Test, and Development Commands

- `npm install`: install plugin dependencies.
- `npm run build`: compile the plugin with `strapi-plugin build` and update `dist`.
- `npm run watch`: rebuild during local plugin development.
- `npm run watch:link`: watch and link the plugin into a consuming Strapi app.
- `npm run verify`: run Strapi plugin verification checks.
- `npm run test:ts:front`: type-check the admin package with `admin/tsconfig.json`.
- `npm run test:ts:back`: type-check the server package with `server/tsconfig.json`.

Run both TypeScript checks before submitting changes that touch `admin/src` or `server/src`.

## Coding Style & Naming Conventions

Use TypeScript and existing Strapi plugin patterns. Formatting is controlled by `.editorconfig` and `.prettierrc`: 2-space indentation, LF line endings, single quotes, trailing commas where valid in ES5, and a 100-character print width. Prefer Strapi-style files such as `controller.ts`, `service.ts`, and `index.ts`, and PascalCase React components like `JoditInput.tsx`.

## Testing Guidelines

There is no dedicated unit test suite in this repository currently. Treat type checks and plugin verification as the baseline validation:

```bash
npm run test:ts:front
npm run test:ts:back
npm run verify
```

For UI changes, also test in a local Strapi admin instance and verify editor loading, media library integration, toolbar behavior, and dark/light theme rendering. If adding tests later, colocate them near the code they cover, for example `JoditInput.test.tsx`.

## Commit & Pull Request Guidelines

Recent commits use short summaries such as `Added Ctrl+Shift+V paste behavior` and `Fix dark theme .jodit-wysiwyg colors. Added dist`. Keep commits focused and mention generated `dist` updates when included. Pull requests should include a concise description, validation commands run, linked issues when applicable, and screenshots or recordings for visible admin UI changes.

## Security & Configuration Tips

Do not hard-code Strapi credentials, API tokens, or backend URLs. Use Strapi configuration files in the consuming application for plugin enablement, for example `config/plugins.ts`, and keep local environment details out of committed source.
