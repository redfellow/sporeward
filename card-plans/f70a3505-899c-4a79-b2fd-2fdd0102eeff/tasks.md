# Tasks

- [ ] 1.1 Confirm the repo needs no change: a934bd4 touched only Markdown.
  - proof: `git diff --stat a934bd4~1 a934bd4 -- . ':(exclude)*.md' ':(exclude)*.yaml'`

## Manual checks after merge (The user)
- Give `_main` its own node_modules, or allow the checks to write to the main checkout's node_modules.
- Let Vitest write its API token to one of its two token paths.
- Re-run main's install and unit checks and confirm both pass.
