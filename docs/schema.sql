-- ============================================================================
-- Oliver Fit — Schema de dados (Supabase / Postgres)
-- Gerado em 18/08/2026. Pronto para colar no SQL Editor do projeto Supabase
-- assim que ele for criado (a criação da conta/projeto é ação do usuário).
--
-- Convenções:
--   - Todo campo monetário/numérico de treino e dieta usa NUMERIC de precisão
--     fixa (nunca FLOAT/REAL), para não introduzir erro de arredondamento
--     intermediário em somas de macro/carga ao longo do tempo.
--   - Toda tabela de dado pessoal tem RLS habilitado, mesmo sendo uso
--     individual — protege o dado caso o projeto cresça no futuro.
--   - user_id referencia auth.users(id), populado pelo Supabase Auth
--     (Google Sign-In).
-- ============================================================================

-- Extensão para geração de UUID
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. profiles — dados do usuário e metas diárias
-- ----------------------------------------------------------------------------
create table public.profiles (
  id                      uuid primary key references auth.users(id) on delete cascade,
  display_name            text,
  height_cm               numeric(5,2),
  birth_date              date,
  sex                     text check (sex in ('male', 'female', 'other')),
  initial_weight_kg       numeric(5,2),
  goal_weight_kg          numeric(5,2),
  daily_calorie_goal      integer,
  daily_protein_goal_g    numeric(6,2),
  daily_carb_goal_g       numeric(6,2),
  daily_fat_goal_g        numeric(6,2),
  timezone                text not null default 'America/Sao_Paulo',
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 2. exercises — biblioteca própria de exercícios do usuário
-- ----------------------------------------------------------------------------
create table public.exercises (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  name           text not null,
  muscle_group   text,
  equipment      text,
  notes          text,
  created_at     timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 3. workout_plans — planos de treino (ex.: "Push Day", "Pernas")
-- ----------------------------------------------------------------------------
create table public.workout_plans (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  name         text not null,
  description  text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

-- Exercícios dentro de um plano, com alvo de séries/reps/carga
create table public.workout_plan_exercises (
  id              uuid primary key default gen_random_uuid(),
  plan_id         uuid not null references public.workout_plans(id) on delete cascade,
  exercise_id     uuid not null references public.exercises(id) on delete restrict,
  order_index     smallint not null default 0,
  target_sets     smallint,
  target_reps     smallint,
  target_load_kg  numeric(6,2),
  rest_seconds    integer default 90
);

-- Em quais dias da semana cada plano roda (0 = domingo ... 6 = sábado)
create table public.workout_schedule (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  plan_id     uuid not null references public.workout_plans(id) on delete cascade,
  weekday     smallint not null check (weekday between 0 and 6),
  unique (user_id, weekday)
);

-- ----------------------------------------------------------------------------
-- 4. workout_sessions — execução real do treino em um dia
-- ----------------------------------------------------------------------------
create table public.workout_sessions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  plan_id        uuid references public.workout_plans(id) on delete set null,
  session_date   date not null,
  started_at     timestamptz,
  completed_at   timestamptz,
  status         text not null default 'in_progress'
                   check (status in ('in_progress', 'completed', 'skipped')),
  unique (user_id, session_date)
);

-- Séries realizadas dentro de uma sessão de treino
create table public.set_logs (
  id             uuid primary key default gen_random_uuid(),
  session_id     uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_id    uuid not null references public.exercises(id) on delete restrict,
  set_number     smallint not null,
  reps           integer,
  load_kg        numeric(6,2),
  rest_seconds   integer,
  completed_at   timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 5. meals — registro manual de alimentos (atômico: um item por refeição)
-- ----------------------------------------------------------------------------
create table public.meals (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  meal_date    date not null,
  meal_type    text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  name         text not null,
  quantity     text,               -- ex.: "150g", "1 unidade" — texto livre no v1
  calories     integer not null,
  protein_g    numeric(6,2) not null default 0,
  carbs_g      numeric(6,2) not null default 0,
  fat_g        numeric(6,2) not null default 0,
  logged_at    timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 6. measurements — peso e medidas corporais por data
-- ----------------------------------------------------------------------------
create table public.measurements (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  measured_at   date not null,
  weight_kg     numeric(5,2),
  waist_cm      numeric(5,2),
  arm_cm        numeric(5,2),
  chest_cm      numeric(5,2),
  hip_cm        numeric(5,2),
  thigh_cm      numeric(5,2),
  notes         text,
  unique (user_id, measured_at)
);

-- ----------------------------------------------------------------------------
-- 7. progress_photos — fotos de progresso (arquivo fica no Supabase Storage)
-- ----------------------------------------------------------------------------
create table public.progress_photos (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  taken_at      date not null,
  storage_path  text not null,     -- caminho no bucket do Supabase Storage
  angle         text check (angle in ('front', 'side', 'back')),
  created_at    timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 8. trail_days — um registro por dia, alimenta a trilha estilo Duolingo
-- ----------------------------------------------------------------------------
-- REGRA FECHADA (18/08/2026):
--   workout_completed = existe workout_sessions do dia com status = 'completed'
--   diet_completed     = pelo menos 3 refeições registradas no dia
--                         E soma de calorias do dia entre 90% e 110% da
--                         meta diária (profiles.daily_calorie_goal)
-- Ver view v_daily_nutrition_status logo abaixo, que calcula diet_completed.
-- Ela deve ser consultada pela aplicação (ou por uma Supabase Edge Function
-- disparada em insert/update de meals) para manter trail_days.diet_completed
-- sincronizado — não é um generated column porque depende de duas tabelas.
create table public.trail_days (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.profiles(id) on delete cascade,
  trail_date          date not null,
  workout_completed   boolean not null default false,
  diet_completed      boolean not null default false,
  day_completed       boolean generated always as (workout_completed and diet_completed) stored,
  completed_at        timestamptz,
  unique (user_id, trail_date)
);

-- View que calcula, por usuário e data, se a dieta do dia bate o critério
-- fechado (>= 3 refeições E calorias entre 90-110% da meta). A aplicação
-- deve chamar isso a cada novo registro de refeição e fazer upsert em
-- trail_days.diet_completed com o resultado.
create view public.v_daily_nutrition_status as
select
  m.user_id,
  m.meal_date,
  count(*)::int as meals_logged,
  sum(m.calories)::int as total_calories,
  p.daily_calorie_goal,
  case
    when p.daily_calorie_goal is null or p.daily_calorie_goal = 0 then null
    else round(100.0 * sum(m.calories) / p.daily_calorie_goal, 2)
  end as pct_of_calorie_goal,
  (
    count(*) >= 3
    and p.daily_calorie_goal is not null
    and p.daily_calorie_goal > 0
    and sum(m.calories) between 0.90 * p.daily_calorie_goal and 1.10 * p.daily_calorie_goal
  ) as diet_completed
from public.meals m
join public.profiles p on p.id = m.user_id
group by m.user_id, m.meal_date, p.daily_calorie_goal;

-- Streak (sequência) e histórico de dias concluídos são CALCULADOS por
-- consulta sobre trail_days, não armazenados em tabela própria — evita
-- estado duplicado que pode divergir do dado de origem. Ver exemplo de
-- view abaixo.
create view public.v_current_streak as
select
  user_id,
  count(*) as current_streak
from (
  select
    user_id,
    trail_date,
    trail_date - (row_number() over (partition by user_id order by trail_date))::int as grp
  from public.trail_days
  where day_completed = true
) t
where grp = (
  select trail_date - (row_number() over (order by trail_date))::int
  from public.trail_days d2
  where d2.user_id = t.user_id and d2.day_completed = true
  order by trail_date desc
  limit 1
)
group by user_id;

-- ============================================================================
-- Row Level Security — habilitar em todas as tabelas de dado pessoal e
-- restringir acesso ao próprio usuário. Padrão replicado tabela a tabela.
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.exercises enable row level security;
alter table public.workout_plans enable row level security;
alter table public.workout_plan_exercises enable row level security;
alter table public.workout_schedule enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.set_logs enable row level security;
alter table public.meals enable row level security;
alter table public.measurements enable row level security;
alter table public.progress_photos enable row level security;
alter table public.trail_days enable row level security;

-- Exemplo de política, replicado para cada tabela com user_id direto
create policy "profiles_self_access" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

create policy "exercises_self_access" on public.exercises
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "workout_plans_self_access" on public.workout_plans
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "workout_schedule_self_access" on public.workout_schedule
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "workout_sessions_self_access" on public.workout_sessions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "meals_self_access" on public.meals
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "measurements_self_access" on public.measurements
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "progress_photos_self_access" on public.progress_photos
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "trail_days_self_access" on public.trail_days
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Tabelas filhas (sem user_id direto) — acesso via join com a tabela pai
create policy "workout_plan_exercises_self_access" on public.workout_plan_exercises
  for all using (
    exists (
      select 1 from public.workout_plans p
      where p.id = plan_id and p.user_id = auth.uid()
    )
  );

create policy "set_logs_self_access" on public.set_logs
  for all using (
    exists (
      select 1 from public.workout_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );
