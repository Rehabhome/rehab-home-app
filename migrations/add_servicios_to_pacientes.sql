alter table public.pacientes
  add column if not exists servicios text[] default '{}';
-- Valores válidos: 'kinesiologia', 'fonoaudiologia', 'terapia_ocupacional'
