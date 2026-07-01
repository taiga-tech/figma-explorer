# Repository Guidelines

## Project Structure & Module Organization

- The current extension entrypoints live under `src/`, such as `src/popup.tsx` and `src/contents/figma-explorer.tsx`. Add new Plasmo pages under `src/` using the same conventions.
- Store static assets in `assets/`.
- Keep product and design docs under `docs/overview`, `docs/architecture`, `docs/project`, and `docs/reference`.
- Track task plans and reviews in `tasks/todo.md`. Add reusable process learnings to `tasks/lessons.md`.

## Build, Test, and Development Commands

- `pnpm dev`: starts the Plasmo development build. Load `build/chrome-mv3-dev` in Chrome for local testing.
- `pnpm build`: creates the production build in `build/`.
- `pnpm package`: generates the packaged extension artifact for distribution.
- `pnpm format`: runs Prettier across `**/*.{ts,tsx,md}`.

## Coding Style & Naming Conventions

- This repo uses TypeScript, React 18, and Plasmo.
- Follow `.prettierrc.mjs`: 2-space indentation, no semicolons, double quotes, `printWidth: 80`, and sorted imports via `@ianvs/prettier-plugin-sort-imports`.
- Use `PascalCase` for React components, `camelCase` for functions and variables, and descriptive file names tied to their entrypoint role.
- Keep new code close to the feature it supports and update `docs/architecture/` when behavior changes materially.

## Testing Guidelines

- No automated test suite is committed yet. At minimum, run `pnpm build` and smoke-test the extension in Chrome before opening a PR.
- Verify the popup UI and any new entrypoints after reloading the unpacked extension.
- If you introduce test infrastructure later, prefer `*.test.ts` or `*.test.tsx` naming and document the command here.

## Commit & Pull Request Guidelines

- Recent commits use short, imperative subjects such as `update todo.md`. Keep commit messages concise and action-oriented.
- PRs should include the goal, affected entrypoints or docs, verification steps, and screenshots or recordings for UI changes.
- Link related GitHub issues when available, especially items tracked in `docs/project/github-issues-v0.1.md`.

## Security & Configuration Tips

- The manifest currently includes `https://*/*` host permissions. Do not broaden permissions without documenting the reason.
- Treat `docs/architecture/` as the source of truth before changing storage, Figma DOM access, or extension page structure.
