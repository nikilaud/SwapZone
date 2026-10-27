-- SwapZone database + storage setup
-- Run the complete script in Supabase Dashboard -> SQL Editor.

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 80),
  description text not null check (char_length(description) between 2 and 1000),
  price numeric(12,2) not null check (price >= 0),
  category text not null check (category in ('Electronics','Home','Fashion','Sports','Other')),
  condition text not null default 'Good' check (condition in ('New','Like New','Good','Fair')),
  image_url text,
  video_url text,
  created_at timestamptz not null default now()
);

create index if not exists listings_created_at_idx on public.listings (created_at desc);
create index if not exists listings_category_idx on public.listings (category);
create index if not exists listings_user_id_idx on public.listings (user_id);

alter table public.listings enable row level security;
grant usage on schema public to anon, authenticated;
grant select on public.listings to anon;
grant select, insert, update, delete on public.listings to authenticated;

drop policy if exists "Listings are visible to everyone" on public.listings;
create policy "Listings are visible to everyone"
on public.listings for select
to anon, authenticated
using (true);

drop policy if exists "Signed-in users can create their own listings" on public.listings;
create policy "Signed-in users can create their own listings"
on public.listings for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own listings" on public.listings;
create policy "Users can update their own listings"
on public.listings for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own listings" on public.listings;
create policy "Users can delete their own listings"
on public.listings for delete
to authenticated
using ((select auth.uid()) = user_id);

-- Create a public bucket for public listing photos, limited to 2 MiB.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-images', 'listing-images', true, 2097152, array['image/webp', 'image/avif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public users can view product photos, but only the owner can manage files
-- inside a folder named with their own Auth user ID.
drop policy if exists "Anyone can view listing images" on storage.objects;
create policy "Anyone can view listing images"
on storage.objects for select
to public
using (bucket_id = 'listing-images');

drop policy if exists "Users upload images to their own folder" on storage.objects;
create policy "Users upload images to their own folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'listing-images'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "Users update images in their own folder" on storage.objects;
create policy "Users update images in their own folder"
on storage.objects for update
to authenticated
using (
  bucket_id = 'listing-images'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id = 'listing-images'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "Users delete images in their own folder" on storage.objects;
create policy "Users delete images in their own folder"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'listing-images'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
