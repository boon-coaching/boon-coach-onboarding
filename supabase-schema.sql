-- Boon Coach Onboarding Portal Database Schema
-- Run this in your Supabase SQL Editor

-- Coaches table
create table if not exists coach_onboarding (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  onboarding_token text unique not null default gen_random_uuid(),
  status text default 'pending' check (status in ('pending', 'in_progress', 'complete')),
  created_at timestamp with time zone default now()
);

-- Onboarding steps
create table if not exists coach_onboarding_steps (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid references coach_onboarding(id) on delete cascade,
  step_key text not null,
  completed boolean default false,
  completed_at timestamp with time zone,
  file_path text,
  review_status text default 'pending' check (review_status in ('pending', 'approved', 'changes_requested')),
  review_feedback text,
  reviewed_at timestamp with time zone,
  unique(coach_id, step_key)
);

-- Coach profiles
create table if not exists coach_onboarding_profiles (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid references coach_onboarding(id) on delete cascade unique,
  bio text,
  headshot_path text,
  specialties text[],
  credentials text,
  linkedin_url text,
  scheduling_preferences text,
  updated_at timestamp with time zone default now()
);

-- Create indexes for better query performance
create index if not exists idx_coach_onboarding_token on coach_onboarding(onboarding_token);
create index if not exists idx_coach_onboarding_steps_coach on coach_onboarding_steps(coach_id);
create index if not exists idx_coach_onboarding_profiles_coach on coach_onboarding_profiles(coach_id);

-- Enable Row Level Security
alter table coach_onboarding enable row level security;
alter table coach_onboarding_steps enable row level security;
alter table coach_onboarding_profiles enable row level security;

-- RLS Policies

-- For coach_onboarding table
create policy "Admin full access to coach_onboarding" on coach_onboarding
  for all using (auth.uid() is not null);

create policy "Coaches can view own data by token" on coach_onboarding
  for select using (true);

-- For coach_onboarding_steps table
create policy "Admin full access to coach_onboarding_steps" on coach_onboarding_steps
  for all using (auth.uid() is not null);

create policy "Coaches can view own steps" on coach_onboarding_steps
  for select using (
    coach_id in (select id from coach_onboarding)
  );

create policy "Coaches can update own steps" on coach_onboarding_steps
  for update using (
    coach_id in (select id from coach_onboarding)
  );

create policy "Coaches can insert own steps" on coach_onboarding_steps
  for insert with check (
    coach_id in (select id from coach_onboarding)
  );

-- For coach_onboarding_profiles table
create policy "Admin full access to coach_onboarding_profiles" on coach_onboarding_profiles
  for all using (auth.uid() is not null);

create policy "Coaches can view own profile" on coach_onboarding_profiles
  for select using (
    coach_id in (select id from coach_onboarding)
  );

create policy "Coaches can update own profile" on coach_onboarding_profiles
  for update using (
    coach_id in (select id from coach_onboarding)
  );

create policy "Coaches can insert own profile" on coach_onboarding_profiles
  for insert with check (
    coach_id in (select id from coach_onboarding)
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
create or replace function initialize_coach_onboarding_steps()
returns trigger as $$
begin
  insert into coach_onboarding_steps (coach_id, step_key)
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

  insert into coach_onboarding_profiles (coach_id)
  values (new.id);

  return new;
end;
$$ language plpgsql;

-- Trigger to auto-create steps when a coach is added
drop trigger if exists on_coach_onboarding_created on coach_onboarding;
create trigger on_coach_onboarding_created
  after insert on coach_onboarding
  for each row execute function initialize_coach_onboarding_steps();

-- Function to update coach status based on steps
create or replace function update_coach_onboarding_status()
returns trigger as $$
declare
  completed_count int;
  total_count int;
begin
  select count(*) filter (where completed = true), count(*)
  into completed_count, total_count
  from coach_onboarding_steps
  where coach_id = new.coach_id;

  if completed_count = total_count then
    update coach_onboarding set status = 'complete' where id = new.coach_id;
  elsif completed_count > 0 then
    update coach_onboarding set status = 'in_progress' where id = new.coach_id;
  else
    update coach_onboarding set status = 'pending' where id = new.coach_id;
  end if;

  return new;
end;
$$ language plpgsql;

-- Trigger to update status when steps change
drop trigger if exists on_coach_onboarding_step_updated on coach_onboarding_steps;
create trigger on_coach_onboarding_step_updated
  after update on coach_onboarding_steps
  for each row execute function update_coach_onboarding_status();
