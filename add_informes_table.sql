-- Migración: crear tabla informes
-- Ejecutar en Supabase SQL Editor (Dashboard → SQL Editor → New query)

create table if not exists public.informes (
  id            uuid        primary key default gen_random_uuid(),
  paciente_id   uuid        not null references public.pacientes(id) on delete cascade,
  profesional_id uuid       references public.profesionales(id),
  tipo          text        not null,
  fecha         date        not null default current_date,
  datos         jsonb       not null default '{}',
  created_at    timestamptz not null default now()
);

-- Índices para filtrado rápido
create index if not exists informes_paciente_id_idx  on public.informes(paciente_id);
create index if not exists informes_profesional_id_idx on public.informes(profesional_id);
create index if not exists informes_tipo_idx          on public.informes(tipo);

-- Valores válidos para `tipo`:
-- 'ingreso_kinesico', 'kinesico_mensual', 'ingreso_dismovilidad', 'ingreso_neuro', 'ktm_domicilio'
-- 'ingreso_fono', 'mensual_fono'
-- 'ingreso_to', 'mensual_to'
