-- Adicionar coluna de setores (array) à tabela tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS sectors text[] DEFAULT '{}';

-- Migrar dados existentes: Copiar sector_id para sectors array
UPDATE public.tasks 
SET sectors = ARRAY[sector_id] 
WHERE sector_id IS NOT NULL AND (sectors IS NULL OR sectors = '{}');

-- (Opcional) Remover sector_id futuramente, mas manter por enquanto para compatibilidade
-- ALTER TABLE public.tasks DROP COLUMN sector_id;
