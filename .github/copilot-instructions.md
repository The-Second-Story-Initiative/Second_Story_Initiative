# Copilot Instructions for Second Story Initiative

## Project Architecture & Key Components
- **Frontend**: React + TypeScript app in `src/` (pages, components, hooks, stores, types, utils)
- **Backend**: Express + TypeScript API in `api/` (routes, middleware, config, slack bot, database)
- **Database**: Supabase PostgreSQL, schema/migrations in `supabase/migrations/`
- **AI Integration**: Claude 4.1 via custom prompts, config in `api/config/claude.ts`
- **Slack Bot**: Automated workflows, monitoring, and slash commands in `api/slack/`
- **DevOps**: Docker, Vercel, GitHub Actions, see `docker-compose.yml`, `vercel.json`, and CI/CD scripts

## Developer Workflows
- **Install dependencies**: `npm install`
- **Start dev servers**: `npm run dev` (full stack), `npm run client:dev` (frontend), `npm run server:dev` (backend)
- **Database setup**: `npm run setup:database` (runs migrations)
- **Testing**: `npm test`, `npm run test:coverage`, `npm run test:watch`, test files in `tests/`
- **Linting/Formatting**: `npm run lint`, TypeScript, ESLint, Prettier enforced
- **Build for production**: `npm run build`, `npm run build:server`, `npm run build:all`

## Conventions & Patterns
- **TypeScript everywhere**: All code (frontend/backend) is typed; types in `src/types/` and `api/types/`
- **RESTful API**: Route handlers in `api/routes/`, business logic in `api/slack/` and `api/server.ts`
- **Authentication**: Middleware in `api/middleware/auth.ts`, JWT-based
- **AI/Claude**: Use `api/config/claude.ts` for prompt engineering and API calls
- **Slack**: Slash commands and automation in `api/slack/`, see `CREATE_SLASH_COMMANDS.md` for patterns
- **Frontend Routing**: Page components in `src/pages/`, protected routes via `src/components/ProtectedRoute.tsx`
- **State Management**: Pinia/Vuex-like store in `src/stores/authStore.ts`
- **Testing**: Jest for unit/integration tests, coverage >80%, tests in `tests/`
- **Environment Variables**: `.env` required, see README for keys (Supabase, Claude, GitHub, JWT)

## Integration Points
- **Supabase**: Used for auth, storage, and relational data; migrations in `supabase/migrations/`
- **Claude AI**: Integrated for mentoring, code review, and recommendations
- **Slack**: Bot automates onboarding, monitoring, and reporting
- **GitHub API**: Used for project showcase and code review features

## Examples
- **Add a new API route**: Create file in `api/routes/`, register in `api/index.ts`
- **Add a Slack command**: Update `api/slack/`, document in `assets/CREATE_SLASH_COMMANDS.md`
- **Add a frontend page**: Create in `src/pages/`, add route in `src/App.tsx`
- **Add a migration**: Place SQL in `supabase/migrations/`, run setup script

## References
- See `README.md` for setup, architecture, and workflow details
- See `assets/SLACK_ECOSYSTEM_README.md` and `assets/CREATE_SLASH_COMMANDS.md` for Slack bot conventions
- See `api/config/claude.ts` for AI integration patterns

---
**Tip:** Always follow existing patterns and update documentation/tests for new features. Ask for clarification if project-specific logic is unclear.
