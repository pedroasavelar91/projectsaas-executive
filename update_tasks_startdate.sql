-- Adicionar coluna start_date na tabela tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS start_date text;

-- (Opcional) Preencher start_date com created_at para tarefas existentes, se desejar
-- UPDATE public.tasks SET start_date = date(created_at)::text WHERE start_date IS NULL;
