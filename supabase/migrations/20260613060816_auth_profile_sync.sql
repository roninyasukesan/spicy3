create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  metadata jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  requested_role text := lower(coalesce(metadata ->> 'role', 'client'));
  safe_role text;
  profile_age integer;
  profile_characteristics jsonb;
begin
  safe_role := case
    when requested_role in ('model', 'modelo') then 'model'
    else 'client'
  end;

  if coalesce(metadata ->> 'age', '') ~ '^[0-9]{1,3}$' then
    profile_age := (metadata ->> 'age')::integer;
  end if;

  profile_characteristics := case
    when jsonb_typeof(metadata -> 'characteristics') = 'object' then
      (metadata -> 'characteristics') || jsonb_build_object(
        'age',
        coalesce(
          metadata -> 'characteristics' ->> 'age',
          metadata -> 'characteristics' ->> 'ageRange',
          ''
        )
      )
    else '{}'::jsonb
  end;

  insert into public.profiles (
    id,
    user_id,
    email,
    role,
    name,
    display_name,
    phone,
    city,
    age,
    bio,
    services,
    fetishes,
    exclusions,
    price,
    price_range,
    characteristics,
    plan_tier,
    is_verified
  )
  values (
    new.id,
    new.id,
    lower(new.email),
    safe_role,
    nullif(metadata ->> 'full_name', ''),
    nullif(metadata ->> 'full_name', ''),
    nullif(metadata ->> 'phone', ''),
    nullif(metadata ->> 'city', ''),
    profile_age,
    coalesce(metadata ->> 'bio', ''),
    case
      when jsonb_typeof(metadata -> 'services') = 'array'
        then array(select jsonb_array_elements_text(metadata -> 'services'))
      else '{}'::text[]
    end,
    case
      when jsonb_typeof(metadata -> 'fetishes') = 'array'
        then array(select jsonb_array_elements_text(metadata -> 'fetishes'))
      else '{}'::text[]
    end,
    case
      when jsonb_typeof(metadata -> 'exclusions') = 'array'
        then array(select jsonb_array_elements_text(metadata -> 'exclusions'))
      else '{}'::text[]
    end,
    nullif(metadata ->> 'price_range', ''),
    nullif(metadata ->> 'price_range', ''),
    profile_characteristics,
    'free',
    false
  )
  on conflict (id) do update
  set
    user_id = excluded.user_id,
    email = coalesce(excluded.email, public.profiles.email),
    role = case
      when public.profiles.role = 'admin' then public.profiles.role
      else excluded.role
    end,
    name = coalesce(excluded.name, public.profiles.name),
    display_name = coalesce(excluded.display_name, public.profiles.display_name),
    phone = coalesce(excluded.phone, public.profiles.phone),
    city = coalesce(excluded.city, public.profiles.city),
    age = coalesce(excluded.age, public.profiles.age),
    bio = coalesce(nullif(excluded.bio, ''), public.profiles.bio),
    services = case
      when cardinality(excluded.services) > 0 then excluded.services
      else public.profiles.services
    end,
    fetishes = case
      when cardinality(excluded.fetishes) > 0 then excluded.fetishes
      else public.profiles.fetishes
    end,
    exclusions = case
      when cardinality(excluded.exclusions) > 0 then excluded.exclusions
      else public.profiles.exclusions
    end,
    price = coalesce(excluded.price, public.profiles.price),
    price_range = coalesce(excluded.price_range, public.profiles.price_range),
    characteristics = case
      when excluded.characteristics <> '{}'::jsonb
        then excluded.characteristics
      else public.profiles.characteristics
    end;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

revoke all on function public.handle_new_user() from public, anon, authenticated;
