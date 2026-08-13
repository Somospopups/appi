-- APPI Histórico · configuración de Supabase
-- Ejecutar una sola vez en SQL Editor del proyecto.

create table if not exists public.historico_periodos (
  user_id uuid not null references auth.users(id) on delete cascade,
  period_id text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, period_id)
);

alter table public.historico_periodos enable row level security;
grant select, insert, update, delete on public.historico_periodos to authenticated;

drop policy if exists "historico_select_own" on public.historico_periodos;
create policy "historico_select_own"
on public.historico_periodos for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "historico_insert_own" on public.historico_periodos;
create policy "historico_insert_own"
on public.historico_periodos for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "historico_update_own" on public.historico_periodos;
create policy "historico_update_own"
on public.historico_periodos for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "historico_delete_own" on public.historico_periodos;
create policy "historico_delete_own"
on public.historico_periodos for delete
to authenticated
using (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit)
values ('historico-files', 'historico-files', false, 52428800)
on conflict (id) do update set public = false, file_size_limit = 52428800;

drop policy if exists "historico_files_select_own" on storage.objects;
create policy "historico_files_select_own"
on storage.objects for select
to authenticated
using (
  bucket_id = 'historico-files'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "historico_files_insert_own" on storage.objects;
create policy "historico_files_insert_own"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'historico-files'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "historico_files_update_own" on storage.objects;
create policy "historico_files_update_own"
on storage.objects for update
to authenticated
using (
  bucket_id = 'historico-files'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'historico-files'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "historico_files_delete_own" on storage.objects;
create policy "historico_files_delete_own"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'historico-files'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create index if not exists historico_periodos_updated_idx
on public.historico_periodos (user_id, updated_at desc);
