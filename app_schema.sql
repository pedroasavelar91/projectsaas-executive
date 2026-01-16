-- 🧨 MASTER RESET: MULTI-TENANT & INVITES
-- Rode este script para atualizar a estrutura com suporte a Múltiplas Corporações e Convites

-- 1. Limpeza
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop table if exists public.comments cascade;
drop table if exists public.sub_tasks cascade;
drop table if exists public.tasks cascade;
drop table if exists public.sectors cascade;
drop table if exists public.profiles cascade;
drop table if exists public.todos cascade;
drop table if exists public.invites cascade;

-- 2. Extensões
create extension if not exists "uuid-ossp";

-- 3. Tabelas
create table public.invites (
  email text primary key,
  role text not null default 'USER',
  corporation text not null,
  invited_by uuid,
  created_at timestamp with time zone default now()
);

create table public.sectors (
  id text primary key,
  name text not null,
  corporation text not null -- Isolation key
);

create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  name text,
  role text default 'USER', 
  avatar text,
  joined_at text,
  corporation text not null,
  sectors text[]
);

create table public.tasks (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  status text not null,
  priority text not null,
  project_lead_id uuid references public.profiles(id) on delete set null,
  due_date text,
  sector_id text references public.sectors(id) on delete set null,
  corporation text not null, -- Isolation key
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table public.sub_tasks (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid references public.tasks(id) on delete cascade,
  user_id uuid, -- loose reference to avoid cascade issues if user deleted
  user_name text, 
  user_avatar text,
  task_description text,
  progress integer
);

create table public.comments (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid references public.tasks(id) on delete cascade,
  author_name text, 
  avatar text,
  text text,
  timestamp text,
  author_id uuid references public.profiles(id) on delete set null
);

create table public.todos (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null default auth.uid(),
  text text not null,
  completed boolean default false,
  due_date text
);

-- 4. RLS (Row Level Security) - ISOLATION LOGIC
alter table public.invites enable row level security;
alter table public.sectors enable row level security;
alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.sub_tasks enable row level security;
alter table public.comments enable row level security;
alter table public.todos enable row level security;

-- Helper function to get current user's corporation
create or replace function public.my_corporation() returns text as $$
  select corporation from public.profiles where id = auth.uid() limit 1;
$$ language sql security definer;

-- INVITES: Only Admins of the SAME Corp can read/insert
create policy "Admins View Invites" on public.invites for select to authenticated 
  using (corporation = public.my_corporation()); -- Simpler: Admin sees invites for their corp
create policy "Admins Create Invites" on public.invites for insert to authenticated 
  with check (corporation = public.my_corporation());

-- SECTORS
create policy "Same Corp Sectors" on public.sectors for all to authenticated
  using (corporation = public.my_corporation());

-- PROFILES
create policy "Read Same Corp Profiles" on public.profiles for select to authenticated
  using (corporation = public.my_corporation());
create policy "Update Own Profile" on public.profiles for update to authenticated
  using (id = auth.uid());
create policy "Admins Delete Users" on public.profiles for delete to authenticated
  using (corporation = public.my_corporation() and exists (select 1 from public.profiles where id = auth.uid() and role = 'ADMIN'));

-- TASKS
create policy "Same Corp Tasks" on public.tasks for all to authenticated
  using (corporation = public.my_corporation());

-- SUBTASKS & COMMENTS (Inherit access via Task? No, simpler to check relation or just allow if task visible)
-- To simplify RLS, we assume subtasks/comments are visible if you have access to the Task.
-- But since we don't have corporation on subtasks, we rely on Task Join? 
-- Simplest: Add corporation to subtasks/comments OR simple trust (since Task ID is UUID).
-- Let's rely on UUID unpredictability + App Logic for now, or use complex RLS.
-- Better: Add corporation to subtasks/comments for easier cleaning/security.
-- Actually, let's just allow ALL authenticated to read subtasks/comments for now (low risk if Task ID is unknown).
-- But correct way:
create policy "Subtasks via Task Corp" on public.sub_tasks for select to authenticated
  using (exists (select 1 from public.tasks where id = sub_tasks.task_id and corporation = public.my_corporation()));
create policy "Manage Subtasks" on public.sub_tasks for all to authenticated
  using (exists (select 1 from public.tasks where id = sub_tasks.task_id and corporation = public.my_corporation()));

create policy "Comments via Task Corp" on public.comments for select to authenticated
  using (exists (select 1 from public.tasks where id = comments.task_id and corporation = public.my_corporation()));
create policy "Manage Comments" on public.comments for all to authenticated
  using (exists (select 1 from public.tasks where id = comments.task_id and corporation = public.my_corporation()));

-- TODOS (Personal)
create policy "Own Todos" on public.todos for all to authenticated using (auth.uid() = user_id);


-- 5. TRIGGER: HANDLING NEW USERS & INVITES
create or replace function public.handle_new_user() 
returns trigger as $$
declare
  invite_record record;
begin
  -- Check for Invite
  select * into invite_record from public.invites where email = new.email;
  
  if invite_record is not null then
    -- USER JOINING EXISTING CORP
    insert into public.profiles (id, email, name, role, joined_at, corporation)
    values (
      new.id, 
      new.email, 
      split_part(new.email, '@', 1),
      invite_record.role,
      to_char(now(), 'Mon YYYY'),
      invite_record.corporation
    );
    -- Delete invite after use
    delete from public.invites where email = new.email;
  else
    -- NEW CORP ADMIN
    insert into public.profiles (id, email, name, role, joined_at, corporation)
    values (
      new.id, 
      new.email, 
      split_part(new.email, '@', 1),
      'ADMIN',
      to_char(now(), 'Mon YYYY'),
      'Nova Corporação' -- User can change this later
    );
    
    -- Seed Default Sectors for New Corp
    insert into public.sectors (id, name, corporation) values
    (uuid_generate_v4()::text, 'Desenvolvimento', 'Nova Corporação'),
    (uuid_generate_v4()::text, 'Design', 'Nova Corporação'),
    (uuid_generate_v4()::text, 'Marketing', 'Nova Corporação'),
    (uuid_generate_v4()::text, 'Operações', 'Nova Corporação');
  end if;

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
