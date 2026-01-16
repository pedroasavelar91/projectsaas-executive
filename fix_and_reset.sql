-- 🧨 MASTER RESET: CORREÇÃO TOTAL (Multi-Tenant & Persistência)
-- Rode este script no Supabase SQL Editor para corrigir a estrutura do banco.

-- 1. LIMPEZA (Drop Everything)
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.my_corporation() cascade;
drop table if exists public.invites cascade;
drop table if exists public.comments cascade;
drop table if exists public.sub_tasks cascade;
drop table if exists public.tasks cascade;
drop table if exists public.sectors cascade;
drop table if exists public.profiles cascade;
drop table if exists public.todos cascade;

-- Limpar usuários (Opcional: comentada por segurança, descomente se quiser limpar usuários também)
-- delete from auth.users; 

-- 2. EXTENSÕES & FUNÇÕES AUXILIARES
create extension if not exists "uuid-ossp";

-- 3. TABELAS (Estrutura Completa)

create table public.invites (
  id uuid primary key default uuid_generate_v4(),
  email text not null,
  role text default 'USER',
  corporation text not null,
  created_at timestamp with time zone default now()
);

create table public.sectors (
  id text primary key,
  name text not null,
  corporation text
);

create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  name text,
  role text default 'USER',
  avatar text,
  joined_at text,
  corporation text,
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
  sector_id text, -- Sem FK estrita para permitir exclusão lógica se necessário, ou manter references public.sectors(id)
  corporation text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table public.sub_tasks (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid references public.tasks(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  user_name text, 
  user_avatar text,
  task_description text,
  progress integer default 0
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

-- 4. FUNÇÃO HELPER RLS
-- Security Definer para evitar recursão infinita no RLS
create or replace function public.my_corporation()
returns text as $$
begin
  return (select corporation from public.profiles where id = auth.uid());
end;
$$ language plpgsql security definer;

-- 5. RLS (Segurança e Isolamento)
alter table public.invites enable row level security;
alter table public.sectors enable row level security;
alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.sub_tasks enable row level security;
alter table public.comments enable row level security;
alter table public.todos enable row level security;

-- Policies GENÉRICAS (Permitem leitura/escrita baseada na corporação)
-- Sectors
create policy "Corp Sectors Select" on public.sectors for select using (corporation is null or corporation = my_corporation());
create policy "Corp Sectors Insert" on public.sectors for insert with check (corporation = my_corporation());
create policy "Corp Sectors Delete" on public.sectors for delete using (corporation = my_corporation());

-- Profiles
create policy "Corp Profiles Read" on public.profiles for select using (corporation = my_corporation() or id = auth.uid() or corporation is null);
create policy "Profiles Update Own" on public.profiles for update using (id = auth.uid());
create policy "Profiles Insert Own" on public.profiles for insert with check (id = auth.uid()); -- Critical for trigger
create policy "Admin Delete User" on public.profiles for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'ADMIN' and corporation = public.profiles.corporation)
);

-- Tasks
create policy "Corp Tasks All" on public.tasks for all using (corporation = my_corporation());

-- Subtasks & Comments (Herdam acesso via Task ou são livres para membros da corp)
create policy "Subtasks All" on public.sub_tasks for all using (
  exists (select 1 from public.tasks where id = task_id and corporation = my_corporation())
);
create policy "Comments All" on public.comments for all using (
  exists (select 1 from public.tasks where id = task_id and corporation = my_corporation())
);

-- Todos (Pessoal)
create policy "Own Todos" on public.todos for all using (user_id = auth.uid());

-- Invites (Admin Only typically, or open for invite logic)
create policy "Admin Manage Invites" on public.invites for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'ADMIN' and corporation = public.invites.corporation)
);
create policy "Read Invites" on public.invites for select using (true); -- Para verificar convites no registro


-- 6. HANDLE NEW USER (Lógica de Convite e Criação Automática)
create or replace function public.handle_new_user() 
returns trigger as $$
declare
  invite_record record;
  is_first_user boolean;
  new_corp text;
  new_role text;
begin
  -- 1. Verifica Metadados (Criação Direta pelo Admin)
  if new.raw_user_meta_data->>'corporation' is not null then
      new_corp := new.raw_user_meta_data->>'corporation';
      -- Tenta converter role, fallback para USER
      begin
        new_role := (new.raw_user_meta_data->>'role')::text;
      exception when others then
        new_role := 'USER';
      end;
      
  else
      -- 2. Verifica Convite
      select * into invite_record from public.invites where email = new.email limit 1;
      
      if found then
        new_corp := invite_record.corporation;
        new_role := invite_record.role;
      else
        -- 3. Fallback: Primeiro usuário vira Admin
        select count(*) = 0 into is_first_user from public.profiles;
        if is_first_user then
           new_corp := 'Nova Corporação';
           new_role := 'ADMIN';
        else
           new_role := 'USER';
           new_corp := 'Corporação Padrão';
        end if;
      end if;
  end if;

  insert into public.profiles (id, email, name, role, joined_at, corporation, sectors)
  values (
    new.id, 
    new.email, 
    split_part(new.email, '@', 1),
    new_role,
    to_char(now(), 'Mon YYYY'),
    new_corp,
    '{}'
  );
  
  -- Se for criado nova corporação, cria setores padrão
  if (not found or new_role = 'ADMIN') and new_corp != 'Corporação Padrão' and not exists (select 1 from public.sectors where corporation = new_corp) then
    insert into public.sectors (id, name, corporation) values
    ('s1-' || new.id, 'Desenvolvimento', new_corp),
    ('s2-' || new.id, 'Marketing', new_corp),
    ('s3-' || new.id, 'Vendas', new_corp);
  end if;

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
