-- KIDSWISE: โครงสร้างฐานข้อมูลเริ่มต้นสำหรับ Supabase
-- เปิดใช้ Row Level Security เพื่อให้ผู้ปกครองเห็นเฉพาะข้อมูลครอบครัวของตน

create table if not exists public.children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 60),
  birth_date date not null,
  created_at timestamptz not null default now()
);

create table if not exists public.growth_records (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  parent_id uuid not null references auth.users(id) on delete cascade,
  recorded_on date not null default current_date,
  weight_kg numeric(5,2) check (weight_kg is null or weight_kg between 0 and 100),
  height_cm numeric(5,1) check (height_cm is null or height_cm between 0 and 220),
  head_circumference_cm numeric(5,1) check (head_circumference_cm is null or head_circumference_cm between 0 and 70),
  created_at timestamptz not null default now()
);

create table if not exists public.milestone_observations (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  parent_id uuid not null references auth.users(id) on delete cascade,
  milestone_code text not null,
  observed_on date not null default current_date,
  note text,
  created_at timestamptz not null default now(),
  unique(child_id, milestone_code)
);

alter table public.children enable row level security;
alter table public.growth_records enable row level security;
alter table public.milestone_observations enable row level security;

create policy "ผู้ปกครองจัดการข้อมูลเด็กของตน"
on public.children for all
using (auth.uid() = parent_id)
with check (auth.uid() = parent_id);

create policy "ผู้ปกครองจัดการบันทึกการเติบโตของตน"
on public.growth_records for all
using (auth.uid() = parent_id)
with check (auth.uid() = parent_id);

create policy "ผู้ปกครองจัดการบันทึกพัฒนาการของตน"
on public.milestone_observations for all
using (auth.uid() = parent_id)
with check (auth.uid() = parent_id);
