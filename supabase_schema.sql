-- Run in Supabase SQL editor. Auth users live in auth.users (managed).
-- We reference auth.users(id) directly.

create table user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text,
  canonical_photo_id uuid,
  height_cm int,
  body_notes jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table uploaded_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_url text not null,
  is_canonical boolean default false,
  quality_score float,
  width int, height int,
  created_at timestamptz default now()
);

create table clothing_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text check (source in ('upload','url')),
  source_url text,
  image_url text not null,
  category text,
  name text,
  created_at timestamptz default now()
);

create table try_ons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  base_photo_id uuid references uploaded_photos(id),
  clothing_item_id uuid references clothing_items(id),
  status text default 'pending',
  provider text default 'fal',
  model text default 'kolors-v1.5',
  result_url text,
  error text,
  created_at timestamptz default now()
);

create table wardrobes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text default 'My Wardrobe',
  created_at timestamptz default now()
);

create table saved_outfits (
  id uuid primary key default gen_random_uuid(),
  wardrobe_id uuid not null references wardrobes(id) on delete cascade,
  try_on_id uuid references try_ons(id),
  name text,
  tags text[],
  notes text,
  created_at timestamptz default now()
);

create index on try_ons (user_id, status);
create index on saved_outfits (wardrobe_id);

-- Enable Row Level Security so users only see their own rows.
alter table user_profiles enable row level security;
alter table uploaded_photos enable row level security;
alter table clothing_items enable row level security;
alter table try_ons enable row level security;
alter table wardrobes enable row level security;
alter table saved_outfits enable row level security;

create policy "own profiles" on user_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own photos" on uploaded_photos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own clothing" on clothing_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own tryons" on try_ons
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own wardrobes" on wardrobes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
