# Codex CLI Setup

This project was originally configured for Claude CLI. Codex compatibility is handled through `AGENTS.md`, while Claude-specific instructions remain in `CLAUDE.md`.

Codex support is additive. Do not remove Claude CLI guidance, Claude-compatible MCP configuration, or working application behavior while making Codex updates.

## Local Commands

```bash
npm run dev
npm run lint
npx tsc --noEmit
npm test -- --runInBand
```

- `npm run dev` starts Next.js on `http://localhost:3001`.
- `npm run lint` is the current fast static check.
- `npx tsc --noEmit` is required before claiming type safety, but the repo currently has pre-existing TypeScript errors.
- `npm test -- --runInBand` is configured, but Jest packages are currently missing from `devDependencies`.

## Current Baseline

Last checked during Codex compatibility setup:

- `codex --version`: available locally as `codex-cli 0.129.0`.
- `codex mcp list`: Context7, sequential-thinking, shadcn, Ref, and Sentry are enabled for Codex; RepoPrompt is present but disabled.
- `npm run lint`: passes.
- `npx tsc --noEmit`: fails with existing app, Supabase typing, Deno edge function, Jest global, Stripe API version, PDF/email typing, and generated-type errors.
- `npm test -- --runInBand`: fails because `jest` is not installed.
- `npm run build`: passes when network access is available. In restricted network sandboxes, it can fail while fetching Google Fonts through `next/font/google`.

Treat TypeScript and Jest cleanup as separate follow-up work. Do not mix those broad fixes into unrelated Codex tasks.

## MCP Setup

The tracked `.mcp.json` is kept for Claude CLI compatibility and must not contain real access tokens. The old Supabase personal access token from this file should be rotated in Supabase if it has ever been committed or shared.

Codex MCP servers are managed in the user Codex config, not by relying on the repo `.mcp.json`. Check current Codex servers with:

```bash
codex mcp list
```

Add a stdio MCP server with:

```bash
codex mcp add <name> -- <command> <args>
```

Add environment variables to stdio MCP servers with `--env KEY=VALUE`. For Supabase, prefer an environment variable instead of putting the access token in repo files:

```bash
codex mcp add supabase-server \
  --env SUPABASE_ACCESS_TOKEN="$SUPABASE_ACCESS_TOKEN" \
  -- npx -y @supabase/mcp-server-supabase@latest \
  --project-ref fnrlzhrchuoiwwsugidz
```

If the token is not available in the shell, export it locally before adding the server. Do not commit that value.

For Claude CLI, keep `.mcp.json` secret-free. Supabase may remain disabled there unless the local developer config supplies credentials safely.

## Codex Usage Notes

- Codex reads `AGENTS.md` for repository instructions.
- Claude reads `CLAUDE.md`; keep it intact for Claude CLI usage.
- Use `rg` for search unless an MCP server gives a better source of truth.
- Use Context7 for current framework and library docs.
- Use Ref for external technical documentation.
- Use shadcn MCP for shadcn/ui components and examples.
- Use Sentry MCP for production issue and trace investigation when relevant.
- Use `agent-browser` for UI verification on `http://localhost:3001`.
- Preserve unrelated work in the tree, including any user-modified files.

## Follow-Up Work

- Rotate the exposed Supabase access token.
- Decide whether to configure Supabase MCP globally for Codex.
- Fix or explicitly scope the TypeScript baseline.
- Install and align Jest tooling, or remove stale Jest scripts if the project will use a different test runner.
