**KINDLY FOLLOW THE RULES BEOFRE YOU WRITE SNY CODE**


<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know


This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Core Development Principles

Always adhere to the following principles across the entire codebase. Detailed guidelines for each can be found in the `.agents/skills/` directory.

1. **Security First**: Validate all inputs, enforce Supabase Row Level Security (RLS) on all database operations, sanitize data, and strictly enforce authentication/authorization boundaries before returning data.
2. **Accessibility (a11y)**: Ensure all UI components are keyboard navigable, use proper ARIA labels, maintain high color contrast (solid opacity for focus rings), and support screen readers.
3. **UX & Aesthetics**: Merchander must maintain a premium, cohesive, and modern SaaS aesthetic. Use the established Tailwind v4 utility tokens (`text-primary`, `bg-surface-elevated`) instead of arbitrary values.
4. **Performance**: Utilize React Server Components wherever possible to minimize client JavaScript. Optimize images, use streaming/suspense for slow data fetches, and avoid unnecessary re-renders in Client Components.
5. **Web App Best Practices**: Strictly follow "Vertical Slicing" when building new features. Build the database schema, server actions, and UI simultaneously. Maintain clean separation of concerns and robust error handling boundaries.
6. **File Size & Modularity**: Keep files focused and maintainable. React components and logic files should ideally stay under **200-250 lines of code**. If a file exceeds this, aggressively refactor by extracting smaller components, hooks, or utility functions.
7. **Never use hardcoded values, instead use the Tailwind v4 utility tokens** (see `node_modules/ui-library`)
8. **Follow naming convections** (see `.agents/skills/naming.md`)
9. **Follow file structure** (see `.agents/skills/file-structure.md`)
10. **Follow database schema** (see `.agents/skills/database-schema.md`)
11. **NEVER commit without running `yarn run lint` and `yarn run format` and `yarn run check` and `yarn run test` and `yarn run build` successfully**
12. **STRICTLY follow the instructions in the .agents/skills/ directory, they are the absolute source of truth**