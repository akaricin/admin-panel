Always read change_summary.txt before making changes.
After finishing all tasks, log changes to change_summary.txt.
Always use Next.js 15 App Router and Tailwind CSS. All admin routes under /admin must be protected by middleware checking for profiles.is_superadmin == true.

# Security Mandates
- **RLS Safety:** This project is for **Data Manipulation Only**. It MUST NEVER contain code that attempts to modify Row Level Security (RLS) policies, database schemas, or use the Supabase Management API.
- **Service Role Usage:** The `SUPABASE_SERVICE_ROLE_KEY` is used strictly for server-side administrative data bypass (e.g., checking superadmin status). It must NEVER be exposed to the client or used for schema changes.

