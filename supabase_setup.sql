-- Create a table for public profiles
create table profiles (
  id uuid references auth.users not null primary key,
  email text,
  role text default 'user',
  approved boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;

-- Create policies
create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- Create a trigger to automatically create a profile when a new user signs up
-- This is optional but recommended if you want to handle it on the database side
-- However, our AuthContext handles it on the client side for now.

-- If you want to make the first user an admin automatically, you can run this manually after signing up:
-- update profiles set role = 'admin', approved = true where email = 'your_email@example.com';
