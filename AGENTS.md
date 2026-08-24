**CRITICAL RULE: READ AND STRICTLY FOLLOW THESE INSTRUCTIONS BEFORE WRITING ANY CODE.**


<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know


This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Core Development Principles

These principles MUST be adhered to across the entire codebase. Detailed guidelines for each topic can be found in the `.agents/skills/` directory, which serves as the absolute source of truth.

1. **Security First**: Validate all inputs, enforce Supabase Row Level Security (RLS) on all database operations, sanitize data, and strictly enforce authentication/authorization boundaries before returning data.
2. **Accessibility (a11y)**: Ensure all UI components are keyboard navigable, use proper ARIA labels, maintain high color contrast (solid opacity for focus rings), and support screen readers.
3. **UX & Aesthetics**: Merchander must maintain a premium, cohesive, and modern SaaS aesthetic. **Never use hardcoded styling values.** Instead, use the established Tailwind v4 utility tokens (e.g., `text-primary`, `bg-surface-elevated`), as defined in `node_modules/ui-library`.
4. **Performance**: Utilize React Server Components wherever possible to minimize client-side JavaScript. Optimize images, use streaming/suspense for slow data fetching, and avoid unnecessary re-renders in Client Components.
5. **Web App Best Practices**: Strictly follow "Vertical Slicing" when building new features. Build the database schema, server actions, and UI simultaneously. Maintain clean separation of concerns and robust error handling boundaries.
6. **Prioritize Modern Standards Over Training Data**: Do not rely purely on what works in older versions. Actively seek out industry standards, best practices, and modern web development trends for performance, accessibility, security, and UX. When stuck or dealing with deprecated APIs, consult online, up-to-date documentation.
7. **File Size & Modularity**: Keep files focused and maintainable. React components and logic files should ideally stay under **200-250 lines of code**. If a file exceeds this limit, aggressively refactor by extracting smaller components, hooks, or utility functions.
8. **Consult Documentation**: **You must read the docs first** (see the `docs/` directory) before writing any new code or implementing new patterns.
9. **Naming Conventions**: Follow the rules defined in `.agents/skills/naming.md`.
10. **File Structure**: Follow the structure defined in `.agents/skills/file-structure.md`.
11. **Database Schema**: Follow the guidelines defined in `.agents/skills/database-schema.md`.
12. **Pre-Commit Checklist**: **NEVER commit code** without successfully running the following commands: `yarn run lint`, `yarn run format`, `yarn run check`, `yarn run test`, and `yarn run build`.
13. **Skill Instructions**: **STRICTLY follow the instructions in the `.agents/skills/` directory.** They supersede any conflicting general knowledge.
14. **When Misguided**: When being misguided, alert me and ask me to confirm or correct the course of action. Even if I'm wrong, just point it out and ask for my confirmation.
15. **Protect Sensitive Information**: Never hardcode API keys, secrets, or sensitive configuration in the codebase. Always use environment variables (e.g., `process.env.NEXT_PUBLIC_...` for the client or private variables for the server) and ensure they are documented in `.env.example`.
16. **Safe Deletions**: Never perform destructive actions (e.g., dropping database tables, deleting entire directories, or removing significant chunks of existing code) without explicitly asking for permission first.
17. **Graceful Error Handling**: Do not allow errors to fail silently. Always implement proper error boundaries, try-catch blocks, and meaningful logging so that issues can be diagnosed easily.
18. **Clean Code & Comments**: Write code that explains itself through clear naming. Only use comments to explain *why* a decision was made, not *what* the code is doing. Avoid leaving commented-out dead code.
19. **Strict Type Safety (No `any`)**: NEVER use the `any` type in TypeScript. Always define explicit, strong types or interfaces. If a type is truly unknown, use `unknown` and perform proper type narrowing before usage.

# AI Agent Workflow Checklist

To ensure safe, predictable, and high-quality contributions, all AI agents MUST adhere to this behavioral workflow:

1. **The "Discovery First" Rule**: Never guess how a component, utility, or database table is implemented. Before writing any code, actively search the codebase to find existing patterns, shared components, or utility functions that already solve the problem.
2. **The "Blast Radius" Check**: Before modifying any shared component, hook, or global state, check where else it is imported across the project to ensure the change won't break unrelated features.
3. **State Assumptions Explicitly**: Do not silently guess what the user wants when requirements are ambiguous. Explicitly list assumptions or ask clarifying questions *before* starting the implementation.
4. **Step-by-Step Execution**: For complex tasks, present a high-level implementation plan (e.g., "Step 1: Update Schema, Step 2: Create Server Action, Step 3: Build UI") and wait for user approval before executing. No "cowboy coding."
5. **Focused Scope**: Keep changes strictly relevant to the current request. Do not "sneak in" unrelated refactoring, formatting changes, or library updates in files that aren't directly related to the task.
6. **Post-Implementation Verification**: After writing code, logically review your own changes against the original request, check for syntax errors, and run verification tools before handing it back to the user.