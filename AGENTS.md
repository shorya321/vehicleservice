# Codex Project Instructions

This repository is a Next.js vehicle service platform created with Claude CLI and now maintained with Codex CLI as well. Codex support must be additive: do not remove or weaken Claude CLI workflows while improving Codex compatibility.

Claude-specific instructions remain in `CLAUDE.md`. Keep both files aligned on shared project facts, but keep tool names and workflows native to each agent.

## Special Commands

- When the user types `/graphify`, use the `graphify` skill before doing anything else.

## Project Facts

- App framework: Next.js 16 App Router with React 19 and TypeScript strict mode.
- Styling: Tailwind CSS and shadcn/ui components.
- Backend: Supabase for auth, PostgreSQL, storage, migrations, and edge functions.
- Local dev server: `npm run dev` on port `3001`.
- Path alias: `@/*` maps to the repository root.
- Next.js 16 route `params` and `searchParams` are promises and must be awaited.
- Business subdomains/custom domains are isolated to `/business/*` routes by `proxy.ts`.

## Codex Workflow

- Read the existing code first. Prefer `rg` and `rg --files` for code search.
- Use Context7 MCP for current framework/library docs when API behavior matters.
- Use Ref MCP for external technical documentation when available.
- Use shadcn MCP for component lookup and examples when working with shadcn/ui.
- Use Sentry MCP for production error, trace, replay, and release analysis when the user provides Sentry context.
- Use Supabase MCP only when it is configured in the active Codex user config; otherwise document the required database action and do not invent schema state.
- Use `agent-browser` for browser checks, screenshots, and UI debugging after frontend changes.
- If a Claude-only tool is mentioned in older docs, use the closest Codex equivalent or state the gap. Narsil and Exa are not assumed to be available in Codex unless the active Codex MCP list proves otherwise.
- Codex MCP servers are managed primarily in the user Codex config. A tracked `.mcp.json` may exist for Claude compatibility, but it must remain secret-free.

## Code Rules

- Keep edits scoped to the user request and preserve unrelated user changes.
- Do not revert or overwrite work you did not create.
- Do not change working runtime functionality as part of docs, CLI, or MCP compatibility work unless the user explicitly asks for an app change.
- Use Server Components for data fetching by default and Client Components only for browser interactivity.
- Compose existing shadcn/ui and local components before adding new primitives.
- Use React Hook Form with Zod for forms where the project already follows that pattern.
- Keep Supabase service-role usage server-only.
- Always handle Supabase `{ data, error }` responses.
- Implement CORS and JWT handling for Supabase edge functions.
- Do not expose secrets in client code, tracked MCP config, docs, or examples.

## Verification

Run the narrowest useful checks for the change. For normal code edits, prefer:

```bash
npm run lint
npx tsc --noEmit
```

For UI changes, also verify in the browser at `http://localhost:3001`.

Current baseline notes are documented in `docs/codex-cli.md`. Do not claim TypeScript or Jest are clean unless fresh command output proves it.
