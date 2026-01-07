-- Boon Coach Onboarding Portal Database Schema
-- Run this in your Supabase SQL Editor

-- Coaches table
create table if not exists coaches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  onboarding_token text unique not null default gen_random_uuid(),
  status text default 'pending' check (status in ('pending', 'in_progress', 'complete')),
  created_at timestamp with time zone default now()
);

-- Onboarding steps
create table if not exists onboarding_steps (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid references coaches(id) on delete cascade,
  step_key text not null,
  completed boolean default false,
  completed_at timestamp with time zone,
  file_path text,
  unique(coach_id, step_key)
);

-- Coach profiles
create table if not exists coach_profiles (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid references coaches(id) on delete cascade unique,
  bio text,
  headshot_path text,
  specialties text[],
  credentials text,
  linkedin_url text,
  scheduling_preferences text,
  updated_at timestamp with time zone default now()
);

-- Create indexes for better query performance
create index if not exists idx_coaches_token on coaches(onboarding_token);
create index if not exists idx_onboarding_steps_coach on onboarding_steps(coach_id);
create index if not exists idx_coach_profiles_coach on coach_profiles(coach_id);

-- Enable Row Level Security
alter table coaches enable row level security;
alter table onboarding_steps enable row level security;
alter table coach_profiles enable row level security;

-- RLS Policies

-- Admin can do everything (check for authenticated user)
-- You'll need to set your admin user ID after creating the admin account
-- Replace 'YOUR_ADMIN_USER_ID' with the actual UUID

-- For coaches table
create policy "Admin full access to coaches" on coaches
  for all using (auth.uid() is not null);

create policy "Coaches can view own data by token" on coaches
  for select using (true);

-- For onboarding_steps table
create policy "Admin full access to onboarding_steps" on onboarding_steps
  for all using (auth.uid() is not null);

create policy "Coaches can view own steps" on onboarding_steps
  for select using (
    coach_id in (select id from coaches)
  );

create policy "Coaches can update own steps" on onboarding_steps
  for update using (
    coach_id in (select id from coaches)
  );

create policy "Coaches can insert own steps" on onboarding_steps
  for insert with check (
    coach_id in (select id from coaches)
  );

-- For coach_profiles table
create policy "Admin full access to coach_profiles" on coach_profiles
  for all using (auth.uid() is not null);

create policy "Coaches can view own profile" on coach_profiles
  for select using (
    coach_id in (select id from coaches)
  );

create policy "Coaches can update own profile" on coach_profiles
  for update using (
    coach_id in (select id from coaches)
  );

create policy "Coaches can insert own profile" on coach_profiles
  for insert with check (
    coach_id in (select id from coaches)
  );

-- Storage bucket for coach documents
-- Run this in the Supabase Dashboard > Storage > Create bucket
-- Bucket name: coach-documents
-- Make it private (not public)

-- Storage policies (run after creating the bucket)
-- insert policy: "Allow authenticated uploads"
-- select policy: "Allow authenticated downloads"
-- delete policy: "Allow authenticated deletes"

-- Function to initialize onboarding steps for a new coach
create or replace function initialize_coach_steps()
returns trigger as $$
begin
  insert into onboarding_steps (coach_id, step_key)
  values
    (new.id, 'w9'),
    (new.id, '1099'),
    (new.id, 'headshot'),
    (new.id, 'certifications'),
    (new.id, 'profile'),
    (new.id, 'deck_reviewed'),
    (new.id, 'zoom'),
    (new.id, 'gmail'),
    (new.id, 'salesforce');

  insert into coach_profiles (coach_id)
  values (new.id);

  return new;
end;
$$ language plpgsql;

-- Trigger to auto-create steps when a coach is added
drop trigger if exists on_coach_created on coaches;
create trigger on_coach_created
  after insert on coaches
  for each row execute function initialize_coach_steps();

-- Function to update coach status based on steps
create or replace function update_coach_status()
returns trigger as $$
declare
  completed_count int;
  total_count int;
begin
  select count(*) filter (where completed = true), count(*)
  into completed_count, total_count
  from onboarding_steps
  where coach_id = new.coach_id;

  if completed_count = total_count then
    update coaches set status = 'complete' where id = new.coach_id;
  elsif completed_count > 0 then
    update coaches set status = 'in_progress' where id = new.coach_id;
  else
    update coaches set status = 'pending' where id = new.coach_id;
  end if;

  return new;
end;
$$ language plpgsql;

-- Trigger to update status when steps change
drop trigger if exists on_step_updated on onboarding_steps;
create trigger on_step_updated
  after update on onboarding_steps
  for each row execute function update_coach_status();
