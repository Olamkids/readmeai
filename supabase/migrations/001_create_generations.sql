-- Generations table: tracks each README generation for usage limits
create table if not exists public.generations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete set null,
  anonymous_id text, -- fingerprint/IP for unauthenticated users
  repo_url text not null,
  created_at timestamptz default now() not null
);

-- Index for fast usage lookups
create index idx_generations_user_id on public.generations(user_id) where user_id is not null;
create index idx_generations_anonymous_id on public.generations(anonymous_id) where anonymous_id is not null;

-- RLS: users can read their own generations, service role can do anything
alter table public.generations enable row level security;

create policy "Users can view own generations"
  on public.generations for select
  using (auth.uid() = user_id);

create policy "Service role full access"
  on public.generations for all
  using (true)
  with check (true);
