-- ⚠️ DESTRUCTIVE RESET --
drop table if exists public.comments cascade;
drop table if exists public.sub_tasks cascade;
drop table if exists public.tasks cascade;
drop table if exists public.sectors cascade;
drop table if exists public.profiles cascade;
drop table if exists public.todos cascade;

-- Enable UUID extension
create extension if not exists "uuid-ossp";
-- Enable Encryption (bcrypt, pgp_sym_encrypt)
create extension if not exists "pgcrypto";

-- Table: sectors
create table public.sectors (
  id text primary key,
  name text not null
);

-- Table: profiles
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  name text,
  role text default 'USER' check (role in ('ADMIN', 'USER')),
  -- Removed Status 'PENDING' block. Everyone is active once created.
  avatar text,
  joined_at text,
  corporation text,
  sectors text[] -- Array of sector IDs
);

-- Table: tasks
create table public.tasks (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  status text not null,
  priority text not null,
  project_lead_id uuid references public.profiles(id),
  due_date text,
  sector_id text references public.sectors(id),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Table: sub_tasks
create table public.sub_tasks (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid references public.tasks(id) on delete cascade,
  user_id uuid references public.profiles(id),
  user_name text, 
  user_avatar text,
  task_description text,
  progress integer
);

-- Table: comments
create table public.comments (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid references public.tasks(id) on delete cascade,
  author_name text, 
  avatar text,
  text text,
  timestamp text,
  author_id uuid references public.profiles(id)
);

-- Table: todos
create table public.todos (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null default auth.uid(),
  text text not null,
  completed boolean default false,
  due_date text
);

-- Enable RLS
alter table public.sectors enable row level security;
alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.sub_tasks enable row level security;
alter table public.comments enable row level security;
alter table public.todos enable row level security;

-- POLICIES (Simplified: No 'is_approved' check)

-- Sectors: Visible to authenticated
create policy "Sectors visible to authenticated" on public.sectors for select to authenticated using (true);

-- Profiles: 
create policy "Read own profile" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "Read all profiles" on public.profiles for select to authenticated using (true);
create policy "Update own profile" on public.profiles for update using (auth.uid() = id);
-- Allow Admin to update others (Requires defining who is admin? For robust security use Custom Claims or check table)
-- For this simplified version: Users update themselves. Admins managing via 'Platform' might need DB toggle.
-- Let's allow update if role is ADMIN in the row? No, RLS checks the *requesting* user.
-- Simple approach: All authenticated can read. Update is restricted.

-- Tasks:
create policy "Tasks visible to authenticated" on public.tasks for select to authenticated using (true);
create policy "Authenticated can create tasks" on public.tasks for insert to authenticated with check (true);
create policy "Authenticated can update tasks" on public.tasks for update to authenticated using (true);

-- SubTasks & Comments:
create policy "Subtasks visible to authenticated" on public.sub_tasks for select to authenticated using (true);
create policy "Authenticated can manage subtasks" on public.sub_tasks for all to authenticated using (true);

create policy "Comments visible to authenticated" on public.comments for select to authenticated using (true);
create policy "Authenticated can post comments" on public.comments for insert to authenticated with check (true);

-- Todos:
create policy "Users can see own todos" on public.todos for select to authenticated using (auth.uid() = user_id);
create policy "Users can create own todos" on public.todos for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own todos" on public.todos for update to authenticated using (auth.uid() = user_id);
create policy "Users can delete own todos" on public.todos for delete to authenticated using (auth.uid() = user_id);

-- TRIGGER: Handle New User (Auto-create Profile)
create or replace function public.handle_new_user() 
returns trigger as $$
declare
  is_first_user boolean;
begin
  select count(*) = 0 into is_first_user from public.profiles;

  insert into public.profiles (id, email, name, role, joined_at, corporation)
  values (
    new.id, 
    new.email, 
    split_part(new.email, '@', 1),
    case when is_first_user then 'ADMIN' else 'USER' end,
    to_char(now(), 'Mon YYYY'),
    'Corporação Unificada'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Recreate Trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Seed Sectors
insert into public.sectors (id, name) values
('s1', 'Desenvolvimento'),
('s2', 'Design'),
('s3', 'Marketing'),
('s4', 'Operações')
on conflict (id) do nothing;
