-- Permitir que Admins editem perfis da mesma corporação (para atribuir setores, mudar cargos, etc)
create policy "Admin Update Corp Profiles" on public.profiles for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'ADMIN' and corporation = public.profiles.corporation)
);

-- Garantir que a coluna sectors exista (caso banco antigo)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sectors text[] DEFAULT '{}';
