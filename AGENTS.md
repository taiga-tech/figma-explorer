# Repository Guidelines

## Project Structure & Module Organization

- The current extension entrypoints live under `src/`, such as `src/popup.tsx` and `src/contents/figma-explorer.tsx`. Add new Plasmo pages under `src/` using the same conventions.
- Store static assets in `assets/`.
- Keep product and design docs under `docs/overview`, `docs/architecture`, `docs/project`, and `docs/reference`.
- Track task plans and reviews in `tasks/todo.md`. Add reusable process learnings to `tasks/lessons.md`.

## Build, Test, and Development Commands

- Use `mise run <task>` as the standard entrypoint for repository commands. The underlying `pnpm` scripts are implementation details of the tasks in `mise.toml`.
- `mise run dev`: starts the Plasmo development build. Load `build/chrome-mv3-dev` in Chrome for local testing.
- `mise run build`: creates the production build in `build/`.
- `mise run package`: generates the packaged extension artifact for distribution.
- `mise run format`: formats TypeScript, React, Markdown, and CSS files with Prettier.
- `mise run lint`: runs ESLint and Prettier in check mode.
- `mise run typecheck`: runs `tsc --noEmit` for TypeScript type checking.
- `mise run test`: runs Vitest (unit + jsdom DOM fixture tests). See `docs/architecture/testing-strategy.md`.
- `mise run check`: runs lint, type checking, tests, and the production build as the standard complete validation.

## Coding Style & Naming Conventions

- This repo uses TypeScript, React 18, and Plasmo.
- Follow `.prettierrc.mjs`: 2-space indentation, no semicolons, double quotes, `printWidth: 80`, and sorted imports via `@ianvs/prettier-plugin-sort-imports`.
- Use `PascalCase` for React components, `camelCase` for functions and variables, and descriptive file names tied to their entrypoint role.
- Keep new code close to the feature it supports and update `docs/architecture/` when behavior changes materially.

## Testing Guidelines

- Run `mise run check`, then smoke-test the extension in Chrome before opening a PR.
- Place tests next to the module under test as `*.test.ts` / `*.test.tsx`. DOM fixtures live in `tests/fixtures/`.
- Verify the popup UI and any new entrypoints after reloading the unpacked extension.

## Commit & Pull Request Guidelines

- Recent commits use short, imperative subjects such as `update todo.md`. Keep commit messages concise and action-oriented.
- PRs should include the goal, affected entrypoints or docs, verification steps, and screenshots or recordings for UI changes.
- Link related GitHub issues when available, especially items tracked in `docs/project/github-issues-v0.1.md`.

## Security & Configuration Tips

- The manifest currently includes `https://*/*` host permissions. Do not broaden permissions without documenting the reason.
- Treat `docs/architecture/` as the source of truth before changing storage, Figma DOM access, or extension page structure.
