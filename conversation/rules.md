# Agent Rules & Development Guidelines

## 🤖 Agent Behavior Rules

- **ALWAYS ASK BEFORE MAKING CHANGES**: Never modify files, run commands, or make schema changes without explicit user approval first
- **CONFIRM UNDERSTANDING**: Ask clarifying questions if the request is ambiguous
- **EXPLAIN CHANGES**: When proposing changes, clearly explain what will be modified and why
- **PRESERVE USER CONTROL**: The user must approve every change to maintain their ability to follow along
- **LOCAL DEVELOPMENT**: User runs backend at 5000 and frontend at 3000 - Agent MUST NEVER start, stop, or restart servers
- **STRICT PORT ENFORCEMENT**: Frontend MUST run on port 3000, Backend MUST run on port 5000 - NO exceptions, NO alternative ports
- **SERVER MANAGEMENT**: Agent can ONLY run builds (`npm run build`) if necessary - User manages all `npm run dev` and server processes
- **FILE CHANGE INDICATION**: Use **bold** or *italics* for file changes to distinguish from thinking
- **NO CONSOLE LOG SPAM**: Remove debug console logs after fixing issues - keep code clean
- **CONSISTENT QUERY KEYS**: Always match React Query keys between hooks and mutations for proper cache invalidation
- **COMMIT MESSAGES**: After every fix/update/change, provide a concise git commit message that user can copy-paste. When user says "commit!", provide a commit message for recent changes. Do NOT commit changes yourself - User handles all git operations (add, commit, push)
- **GIT WORKFLOW**: Agent NEVER commits or pushes - Agent only provides ready-to-use commit messages for user to execute manually
- **SHORTHAND REFERENCES**:
  - **"a-doc"** = This AGENT.md file (`/home/mhackeedev/_apps/creatives-saas/AGENT.md`)
  - **"b-logs"** = Browser console logs (`/home/mhackeedev/console.log`)
  - **"conversations"** = Documentation directory (`/home/mhackeedev/_apps/creatives-saas/conversations/`)
    - `DEPLOYMENT-GUIDE.md` - Complete deployment workflows and CLI reference
  - **"rules!"** = Agent rules and guidelines (`/home/mhackeedev/_apps/creatives-saas/conversations/rules.md`)
- **MILESTONE DOCUMENTATION**: Update a-doc after every milestone or task completion, then provide a copy-paste ready commit message

## 🏗️ Code Quality Rules

- **SOLID, DRY, YAGNI Principles**: Always implement best programming practices
- **Schema Updates**: Every modification in schema MUST update the seeder and run the seeder to maintain data consistency
- **Seeder Maintenance**: When adding new schema fields or changing existing structures, always update `/backend/prisma/seed.js` to include the new fields with appropriate default values
- **No Manual Database Updates**: NEVER manually update database records with SQL commands. Always update the seeder and regenerate the database using `npx prisma db push && npm run seed`
- **Database Reset Workflow**: When data inconsistencies occur, use the proper workflow:
  1. Update the seeder code in `/backend/prisma/seed.js`
  2. Run `npx prisma db push` to sync schema
  3. Run `npm run seed` to populate with correct data
  4. Verify data integrity
- **Port Consistency**: Always run frontend on 3000 and backend on 5000 for local development. No other ports (3001, 5001, etc.)
- **Build Verification**: Check functionality by building Next.js or Nest.js using their build scripts
- **Error Handling**: Implement graceful error handling with user-friendly messages
- **React Query**: Properly handle cache invalidation, loading states, and error states
- **TypeScript**: Maintain strict typing and resolve compilation errors

## 🚫 DATABASE MIGRATION RULES

**CRITICAL: NO MIGRATIONS DURING DEVELOPMENT**

- ✅ **Use `prisma db push` ONLY** for all schema changes during development
- ❌ **DO NOT use migrations** until MVP production launch
- **Reason**: We're rapidly iterating on schema and features
- **Production**: Will create proper migrations once MVP is finalized

```bash
# ✅ CORRECT - Use for development
npx prisma db push

# ❌ WRONG - Don't use until production
npx prisma migrate dev
npx prisma migrate deploy
```

**Schema Change Workflow:**

1. Update `prisma/schema.prisma`
2. Run `npx prisma db push`
3. Update seeders if schema changes affect seeding
4. Run seeders to maintain updated data
5. Test changes thoroughly
6. Commit to git